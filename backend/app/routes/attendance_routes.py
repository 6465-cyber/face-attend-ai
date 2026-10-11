from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from datetime import datetime, date
from sqlalchemy import or_

from app.extensions import db
from app.models.student import Student
from app.models.attendance import Attendance
from app.models.setting import Setting
from app.services.face_recognition_service import face_service
from app.services.attendance_service import attendance_service
from app.services.export_service import export_service
from app.utils.image_processing import decode_base64_image
from app.utils.helpers import api_response, error_response, format_date

attendance_bp = Blueprint('attendance', __name__, url_prefix='/api/attendance')

@attendance_bp.route('/recognize', methods=['POST'])
@jwt_required()
def recognize_and_mark():
    """
    Real-time face recognition and automatic attendance marking endpoint.
    Receives video frame base64, runs biometric matching, and marks attendance.
    """
    data = request.get_json() or {}
    image_base64 = data.get('image', '')
    
    if not image_base64:
        return error_response('No image frame provided.', 400)

    # Dynamic confidence threshold from settings or payload
    default_thresh = float(Setting.get_val('confidence_threshold', 0.60))
    threshold = float(data.get('threshold', default_thresh))

    img_np = decode_base64_image(image_base64)
    if img_np is None:
        return error_response('Failed to decode image frame.', 400)

    # Fetch all students with enrolled faces
    enrolled_students = Student.query.filter_by(is_face_registered=True).all()
    if not enrolled_students:
        # Detect if any face is in frame at all
        faces = face_service.detect_faces(img_np)
        return api_response(data={
            'detected': len(faces) > 0,
            'match_found': False,
            'box': faces[0]['box'] if faces else None,
            'confidence': 0.0,
            'message': 'No students enrolled yet with facial biometric profiles.'
        })

    # Run recognition
    recognition_result = face_service.recognize_face(img_np, enrolled_students, threshold=threshold)

    if not recognition_result['detected']:
        return api_response(data=recognition_result)

    if not recognition_result['match_found']:
        return api_response(data=recognition_result)

    # Match was found! Proceed to automatic attendance marking
    student = recognition_result['matched_student']
    confidence = recognition_result['confidence']

    mark_result = attendance_service.mark_attendance(
        student=student,
        confidence_score=confidence,
        verification_method='Facial Recognition'
    )

    response_payload = {
        'detected': True,
        'match_found': True,
        'student': student.to_dict(),
        'confidence': confidence,
        'confidence_percentage': recognition_result['confidence_percentage'],
        'box': recognition_result['box'],
        'already_marked': mark_result['already_marked'],
        'attendance_status': mark_result['status'],
        'record': mark_result['record'],
        'message': mark_result['message']
    }

    return api_response(data=response_payload)

@attendance_bp.route('/logs', methods=['GET'])
@jwt_required()
def get_attendance_logs():
    req_date = request.args.get('date', '').strip()
    start_date = request.args.get('start_date', '').strip()
    end_date = request.args.get('end_date', '').strip()
    department = request.args.get('department', '').strip()
    status = request.args.get('status', '').strip()
    search = request.args.get('search', '').strip()

    query = Attendance.query.join(Student, Attendance.student_id == Student.id)

    if req_date:
        if req_date == 'today':
            query = query.filter(Attendance.date == date.today())
        else:
            try:
                d = datetime.strptime(req_date, '%Y-%m-%d').date()
                query = query.filter(Attendance.date == d)
            except Exception:
                pass

    if start_date:
        try:
            sd = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(Attendance.date >= sd)
        except Exception:
            pass

    if end_date:
        try:
            ed = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Attendance.date <= ed)
        except Exception:
            pass

    if department and department != 'All':
        query = query.filter(Student.department == department)

    if status and status != 'All':
        query = query.filter(Attendance.status == status)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Student.student_id.ilike(search_pattern),
                Student.first_name.ilike(search_pattern),
                Student.last_name.ilike(search_pattern)
            )
        )

    records = query.order_by(Attendance.date.desc(), Attendance.time_in.desc()).all()
    return api_response(data=[r.to_dict() for r in records])

@attendance_bp.route('/manual-mark', methods=['POST'])
@jwt_required()
def manual_mark_attendance():
    """Admin manual override to mark attendance."""
    data = request.get_json() or {}
    student_id_val = data.get('student_id')
    status_val = data.get('status', 'Present').strip()
    date_val = data.get('date')
    notes = data.get('notes', 'Marked manually by Administrator')

    if not student_id_val:
        return error_response('Student ID is required.', 400)

    # Find student either by primary id or roll student_id
    student = None
    if isinstance(student_id_val, int) or (isinstance(student_id_val, str) and student_id_val.isdigit()):
        student = db.session.get(Student, int(student_id_val))
    if not student:
        student = Student.query.filter_by(student_id=str(student_id_val).strip()).first()

    if not student:
        return error_response('Student not found.', 404)

    target_date = format_date(date_val)
    
    # Check if record already exists for this date
    existing = Attendance.query.filter_by(student_id=student.id, date=target_date).first()
    if existing:
        existing.status = status_val
        existing.verification_method = 'Manual Admin Override'
        existing.notes = notes
        db.session.commit()
        return api_response(data=existing.to_dict(), message=f"Attendance updated for {student.full_name} ({status_val}).")

    now = datetime.now()
    record = Attendance(
        student_id=student.id,
        date=target_date,
        time_in=now,
        status=status_val,
        confidence_score=1.0,
        verification_method='Manual Admin Override',
        notes=notes
    )

    db.session.add(record)
    db.session.commit()

    return api_response(data=record.to_dict(), message=f"Attendance recorded for {student.full_name} ({status_val})!")

@attendance_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_attendance_record(id):
    record = db.session.get(Attendance, id)
    if not record:
        return error_response('Record not found.', 404)

    db.session.delete(record)
    db.session.commit()
    return api_response(message='Attendance record deleted successfully!')

@attendance_bp.route('/export', methods=['GET'])
@jwt_required()
def export_attendance_file():
    format_type = request.args.get('format', 'csv').lower()
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    department = request.args.get('department')
    status = request.args.get('status')

    sd = None
    ed = None
    if start_date_str:
        try:
            sd = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        except Exception:
            pass
    if end_date_str:
        try:
            ed = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except Exception:
            pass

    return export_service.export_attendance(
        format_type=format_type,
        start_date=sd,
        end_date=ed,
        department=department,
        status=status
    )
