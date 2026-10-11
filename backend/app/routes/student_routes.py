import os
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required
from sqlalchemy import or_
import numpy as np

from app.extensions import db
from app.models.student import Student
from app.models.attendance import Attendance
from app.services.face_recognition_service import face_service
from app.utils.image_processing import decode_base64_image, save_student_photo
from app.utils.helpers import api_response, error_response

student_bp = Blueprint('students', __name__, url_prefix='/api/students')

@student_bp.route('', methods=['GET'])
@jwt_required()
def list_students():
    search = request.args.get('search', '').strip()
    dept = request.args.get('department', '').strip()
    year = request.args.get('year', '').strip()
    face_status = request.args.get('face_status', '').strip()

    query = Student.query

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Student.student_id.ilike(search_pattern),
                Student.first_name.ilike(search_pattern),
                Student.last_name.ilike(search_pattern),
                Student.email.ilike(search_pattern)
            )
        )

    if dept and dept != 'All':
        query = query.filter(Student.department == dept)

    if year and year != 'All':
        query = query.filter(Student.academic_year == year)

    if face_status == 'enrolled':
        query = query.filter(Student.is_face_registered == True)
    elif face_status == 'pending':
        query = query.filter(Student.is_face_registered == False)

    students = query.order_by(Student.student_id.asc()).all()
    return api_response(data=[s.to_dict() for s in students])

@student_bp.route('', methods=['POST'])
@jwt_required()
def create_student():
    data = request.get_json() or {}
    student_id = data.get('student_id', '').strip()
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    email = data.get('email', '').strip()

    if not student_id or not first_name or not last_name or not email:
        return error_response('Student ID, First Name, Last Name, and Email are required.', 400)

    # Check for duplicate student_id
    if Student.query.filter_by(student_id=student_id).first():
        return error_response(f"Student ID '{student_id}' is already registered.", 409)

    # Check for duplicate email
    if Student.query.filter_by(email=email).first():
        return error_response(f"Email '{email}' is already registered to another student.", 409)

    student = Student(
        student_id=student_id,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=data.get('phone', '').strip(),
        department=data.get('department', 'Computer Applications').strip(),
        academic_year=data.get('academic_year', '3rd Year').strip(),
        semester=data.get('semester', 'Semester 6').strip(),
        section=data.get('section', 'A').strip(),
        gender=data.get('gender', 'Other').strip()
    )

    db.session.add(student)
    db.session.commit()

    return api_response(data=student.to_dict(), message='Student created successfully!', status_code=201)

@student_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_student(id):
    student = db.session.get(Student, id)
    if not student:
        return error_response('Student not found.', 404)

    # Get recent attendance logs for this student
    recent_logs = (
        Attendance.query
        .filter_by(student_id=student.id)
        .order_by(Attendance.date.desc())
        .limit(10)
        .all()
    )

    student_data = student.to_dict()
    student_data['recent_attendance'] = [log.to_dict() for log in recent_logs]
    
    total_marked = Attendance.query.filter_by(student_id=student.id).count()
    present_count = Attendance.query.filter(Attendance.student_id == student.id, Attendance.status.in_(['Present', 'Late'])).count()
    student_data['stats'] = {
        'total_marked': total_marked,
        'present_count': present_count,
        'attendance_percentage': round((present_count / total_marked * 100), 1) if total_marked > 0 else 0.0
    }

    return api_response(data=student_data)

@student_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_student(id):
    student = db.session.get(Student, id)
    if not student:
        return error_response('Student not found.', 404)

    data = request.get_json() or {}
    
    new_student_id = data.get('student_id', '').strip()
    new_email = data.get('email', '').strip()

    if new_student_id and new_student_id != student.student_id:
        if Student.query.filter_by(student_id=new_student_id).first():
            return error_response(f"Student ID '{new_student_id}' is already in use.", 409)
        student.student_id = new_student_id

    if new_email and new_email != student.email:
        if Student.query.filter_by(email=new_email).first():
            return error_response(f"Email '{new_email}' is already in use.", 409)
        student.email = new_email

    if 'first_name' in data:
        student.first_name = data['first_name'].strip()
    if 'last_name' in data:
        student.last_name = data['last_name'].strip()
    if 'phone' in data:
        student.phone = data['phone'].strip()
    if 'department' in data:
        student.department = data['department'].strip()
    if 'academic_year' in data:
        student.academic_year = data['academic_year'].strip()
    if 'semester' in data:
        student.semester = data['semester'].strip()
    if 'section' in data:
        student.section = data['section'].strip()
    if 'gender' in data:
        student.gender = data['gender'].strip()

    db.session.commit()
    return api_response(data=student.to_dict(), message='Student updated successfully!')

@student_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_student(id):
    student = db.session.get(Student, id)
    if not student:
        return error_response('Student not found.', 404)

    db.session.delete(student)
    db.session.commit()
    return api_response(message='Student deleted successfully!')

@student_bp.route('/<int:id>/register-face', methods=['POST'])
@jwt_required()
def register_face(id):
    student = db.session.get(Student, id)
    if not student:
        return error_response('Student not found.', 404)

    data = request.get_json() or {}
    image_base64 = data.get('image', '')
    samples = data.get('samples', [])  # Multi-sample capture support

    if not image_base64 and not samples:
        return error_response('No face image data provided.', 400)

    # Process primary or multi-sample frames
    all_embeddings = []
    primary_img_np = None

    images_to_process = samples if samples and len(samples) > 0 else [image_base64]

    for img_str in images_to_process:
        img_np = decode_base64_image(img_str)
        if img_np is None:
            continue
            
        if primary_img_np is None:
            primary_img_np = img_np
            
        faces = face_service.detect_faces(img_np)
        if not faces:
            continue
            
        emb = face_service.extract_face_embedding(img_np, faces[0]['box'])
        if emb:
            all_embeddings.append(emb)

    if not all_embeddings:
        return error_response('Could not detect a clear human face in the captured preview. Please ensure good lighting and face camera directly.', 422)

    # Average the embeddings across captured samples for maximum accuracy and noise invariance
    avg_embedding = np.mean(np.array(all_embeddings, dtype=np.float32), axis=0)
    norm = np.linalg.norm(avg_embedding)
    if norm > 0:
        avg_embedding = avg_embedding / norm

    # Save photo to student upload folder
    photo_rel_path = save_student_photo(
        primary_img_np,
        student.student_id,
        current_app.config['STUDENT_PHOTOS_FOLDER']
    )
    if photo_rel_path:
        student.photo_url = photo_rel_path

    # Set embedding on student record
    student.set_embedding(avg_embedding.tolist())
    db.session.commit()

    return api_response(
        data=student.to_dict(),
        message=f"Facial biometrics enrolled successfully for {student.full_name} ({len(all_embeddings)} samples processed)!"
    )

@student_bp.route('/<int:id>/face', methods=['DELETE'])
@jwt_required()
def remove_face(id):
    student = db.session.get(Student, id)
    if not student:
        return error_response('Student not found.', 404)

    student.set_embedding(None)
    db.session.commit()
    return api_response(data=student.to_dict(), message='Facial biometric data removed.')
