import random
from datetime import datetime, date, timedelta, time
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
import numpy as np

from app.extensions import db
from app.models.setting import Setting
from app.models.student import Student
from app.models.attendance import Attendance
from app.utils.helpers import api_response, error_response

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@settings_bp.route('', methods=['GET'])
@jwt_required()
def get_settings():
    all_settings = Setting.query.all()
    res = {}
    for s in all_settings:
        res[s.key] = s.value
        
    defaults = {
        'institution_name': 'St. Jude College of Computer Applications',
        'confidence_threshold': '0.60',
        'late_threshold_time': '09:30',
        'camera_index': '0',
        'academic_year': '2025 - 2026',
        'auto_attendance_cooldown_seconds': '15'
    }
    for k, v in defaults.items():
        if k not in res:
            res[k] = v
            
    return api_response(data=res)

@settings_bp.route('', methods=['PUT'])
@jwt_required()
def update_settings():
    data = request.get_json() or {}
    for key, value in data.items():
        Setting.set_val(key, str(value))
        
    return api_response(message='System settings updated successfully!')

@settings_bp.route('/seed-sample-data', methods=['POST'])
@jwt_required()
def seed_sample_data():
    """
    Seeds mock students and realistic attendance history.
    Allows examiners/evaluators of the BCA final-year project to evaluate
    all dashboard analytics, charts, reports, and filters instantly!
    """
    sample_students = [
        {"student_id": "BCA2026-001", "first_name": "Aarav", "last_name": "Sharma", "email": "aarav.sharma@college.edu", "phone": "+91 98765 43210", "department": "Computer Applications", "academic_year": "3rd Year", "semester": "Semester 6", "section": "A", "gender": "Male"},
        {"student_id": "BCA2026-002", "first_name": "Diya", "last_name": "Patel", "email": "diya.patel@college.edu", "phone": "+91 98765 43211", "department": "Computer Applications", "academic_year": "3rd Year", "semester": "Semester 6", "section": "A", "gender": "Female"},
        {"student_id": "BCA2026-003", "first_name": "Rohan", "last_name": "Verma", "email": "rohan.verma@college.edu", "phone": "+91 98765 43212", "department": "Computer Applications", "academic_year": "3rd Year", "semester": "Semester 6", "section": "B", "gender": "Male"},
        {"student_id": "BCA2026-004", "first_name": "Ananya", "last_name": "Iyer", "email": "ananya.iyer@college.edu", "phone": "+91 98765 43213", "department": "Information Technology", "academic_year": "2nd Year", "semester": "Semester 4", "section": "A", "gender": "Female"},
        {"student_id": "BCA2026-005", "first_name": "Vikram", "last_name": "Nair", "email": "vikram.nair@college.edu", "phone": "+91 98765 43214", "department": "Information Technology", "academic_year": "2nd Year", "semester": "Semester 4", "section": "B", "gender": "Male"},
        {"student_id": "BCA2026-006", "first_name": "Sneha", "last_name": "Reddy", "email": "sneha.reddy@college.edu", "phone": "+91 98765 43215", "department": "Computer Science", "academic_year": "3rd Year", "semester": "Semester 6", "section": "A", "gender": "Female"},
        {"student_id": "BCA2026-007", "first_name": "Karthik", "last_name": "Menon", "email": "karthik.menon@college.edu", "phone": "+91 98765 43216", "department": "Computer Science", "academic_year": "1st Year", "semester": "Semester 2", "section": "A", "gender": "Male"},
        {"student_id": "BCA2026-008", "first_name": "Pooja", "last_name": "Choudhary", "email": "pooja.c@college.edu", "phone": "+91 98765 43217", "department": "Data Science", "academic_year": "2nd Year", "semester": "Semester 4", "section": "A", "gender": "Female"},
        {"student_id": "BCA2026-009", "first_name": "Aditya", "last_name": "Kapoor", "email": "aditya.k@college.edu", "phone": "+91 98765 43218", "department": "Data Science", "academic_year": "3rd Year", "semester": "Semester 6", "section": "B", "gender": "Male"},
        {"student_id": "BCA2026-010", "first_name": "Meera", "last_name": "Joshi", "email": "meera.j@college.edu", "phone": "+91 98765 43219", "department": "Computer Applications", "academic_year": "1st Year", "semester": "Semester 2", "section": "B", "gender": "Female"},
        {"student_id": "BCA2026-011", "first_name": "Rahul", "last_name": "Sengupta", "email": "rahul.s@college.edu", "phone": "+91 98765 43220", "department": "Computer Applications", "academic_year": "3rd Year", "semester": "Semester 6", "section": "A", "gender": "Male"},
        {"student_id": "BCA2026-012", "first_name": "Priya", "last_name": "Deshmukh", "email": "priya.d@college.edu", "phone": "+91 98765 43221", "department": "Information Technology", "academic_year": "3rd Year", "semester": "Semester 6", "section": "A", "gender": "Female"}
    ]

    added_students = []
    for s_info in sample_students:
        existing = Student.query.filter_by(student_id=s_info['student_id']).first()
        if not existing:
            student = Student(**s_info)
            # Generate deterministic synthetic 128-D embedding for demo evaluation
            seed_val = sum(ord(c) for c in s_info['student_id'])
            np.random.seed(seed_val)
            synthetic_emb = np.random.randn(128).astype(np.float32)
            synthetic_emb /= np.linalg.norm(synthetic_emb)
            student.set_embedding(synthetic_emb.tolist())
            db.session.add(student)
            added_students.append(student)
        else:
            added_students.append(existing)

    db.session.commit()

    # Generate 7 days of realistic attendance history
    today = date.today()
    all_students = Student.query.all()
    created_attendance_count = 0

    for i in range(7):
        att_date = today - timedelta(days=i)
        for s in all_students:
            # 80% chance present, 15% chance late, 5% absent
            roll = random.random()
            if roll < 0.05:
                continue  # Absent on this day
                
            existing_att = Attendance.query.filter_by(student_id=s.id, date=att_date).first()
            if existing_att:
                continue

            if roll < 0.78:
                # Present on time (between 08:45 and 09:25)
                h = random.choice([8, 9])
                m = random.randint(45, 59) if h == 8 else random.randint(0, 25)
                status = 'Present'
            else:
                # Late (between 09:31 and 09:55)
                h = 9
                m = random.randint(31, 55)
                status = 'Late'

            time_in = datetime.combine(att_date, time(h, m, random.randint(0, 59)))
            confidence = round(random.uniform(0.88, 0.98), 4)

            record = Attendance(
                student_id=s.id,
                date=att_date,
                time_in=time_in,
                status=status,
                confidence_score=confidence,
                verification_method='Facial Recognition',
                notes='Biometric verification verified'
            )
            db.session.add(record)
            created_attendance_count += 1

    db.session.commit()

    return api_response(message=f"Seeded sample data successfully! Enrolled {len(added_students)} students and created {created_attendance_count} attendance records.")
