from app import create_app
from app.extensions import db
from app.models.student import Student
from app.models.attendance import Attendance
from app.models.setting import Setting
from datetime import datetime, date, timedelta, time
import random
import numpy as np

def run_seed():
    app = create_app()
    with app.app_context():
        print("Checking existing students...")
        if Student.query.count() > 0:
            print(f"Database already has {Student.query.count()} students.")
            return

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
            {"student_id": "BCA2026-010", "first_name": "Meera", "last_name": "Joshi", "email": "meera.j@college.edu", "phone": "+91 98765 43219", "department": "Computer Applications", "academic_year": "1st Year", "semester": "Semester 2", "section": "B", "gender": "Female"}
        ]

        print("Seeding students...")
        for s_data in sample_students:
            s = Student(**s_data)
            # Generate synthetic initial embedding vector
            seed_val = sum(ord(c) for c in s.student_id)
            np.random.seed(seed_val)
            vec = np.random.randn(128).astype(np.float32)
            vec /= np.linalg.norm(vec)
            s.set_embedding(vec.tolist())
            db.session.add(s)

        db.session.commit()

        # Seed attendance for past 7 days
        today = date.today()
        students = Student.query.all()
        att_count = 0
        print("Seeding attendance records for the past 7 days...")
        for i in range(7):
            d = today - timedelta(days=i)
            for s in students:
                roll = random.random()
                if roll < 0.10:
                    continue # Absent
                
                if roll < 0.80:
                    status = 'Present'
                    h = 9
                    m = random.randint(5, 25)
                else:
                    status = 'Late'
                    h = 9
                    m = random.randint(31, 52)
                
                time_in = datetime.combine(d, time(h, m, random.randint(0, 59)))
                conf = round(random.uniform(0.89, 0.98), 4)
                att = Attendance(
                    student_id=s.id,
                    date=d,
                    time_in=time_in,
                    status=status,
                    confidence_score=conf,
                    verification_method='Facial Recognition',
                    notes='Biometric verification verified'
                )
                db.session.add(att)
                att_count += 1
        
        db.session.commit()
        print(f"Successfully seeded {len(sample_students)} students and {att_count} attendance records!")

if __name__ == '__main__':
    run_seed()
