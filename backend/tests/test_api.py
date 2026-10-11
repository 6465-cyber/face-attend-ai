import os
import unittest
import json
from datetime import date, datetime
import numpy as np

# Set test environment
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['SECRET_KEY'] = 'test-secret-key'
os.environ['JWT_SECRET_KEY'] = 'test-jwt-secret-key'

from app import create_app
from app.extensions import db
from app.models.admin import Admin
from app.models.student import Student
from app.models.attendance import Attendance
from app.services.face_recognition_service import face_service

class FaceAttendApiTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        db.create_all()

        # Seed test admin
        self.admin = Admin(
            username='testadmin',
            email='testadmin@college.edu',
            full_name='Test Admin',
            role='admin'
        )
        self.admin.set_password('password123')
        db.session.add(self.admin)
        db.session.commit()

        # Authenticate and get JWT token
        res = self.client.post('/api/auth/login', json={
            'username': 'testadmin',
            'password': 'password123'
        })
        self.token = res.get_json()['data']['token']
        self.auth_headers = {'Authorization': f'Bearer {self.token}'}

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_health_check(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'healthy')

    def test_admin_login_success_and_failure(self):
        # Valid login
        res = self.client.post('/api/auth/login', json={
            'username': 'testadmin',
            'password': 'password123'
        })
        self.assertEqual(res.status_code, 200)
        self.assertTrue('token' in res.get_json()['data'])

        # Invalid login
        res_fail = self.client.post('/api/auth/login', json={
            'username': 'testadmin',
            'password': 'wrongpassword'
        })
        self.assertEqual(res_fail.status_code, 401)

    def test_student_crud(self):
        # 1. Create Student
        student_payload = {
            'student_id': 'TEST-001',
            'first_name': 'Test',
            'last_name': 'Student',
            'email': 'student@test.edu',
            'phone': '1234567890',
            'department': 'Computer Applications',
            'academic_year': '3rd Year',
            'semester': 'Semester 6',
            'section': 'A',
            'gender': 'Male'
        }
        res = self.client.post('/api/students', json=student_payload, headers=self.auth_headers)
        self.assertEqual(res.status_code, 201)
        created = res.get_json()['data']
        self.assertEqual(created['student_id'], 'TEST-001')

        # 2. Duplicate Student ID should fail (409)
        res_dup = self.client.post('/api/students', json=student_payload, headers=self.auth_headers)
        self.assertEqual(res_dup.status_code, 409)

        # 3. Retrieve student
        student_db_id = created['id']
        res_get = self.client.get(f'/api/students/{student_db_id}', headers=self.auth_headers)
        self.assertEqual(res_get.status_code, 200)

        # 4. Update student
        res_put = self.client.put(
            f'/api/students/{student_db_id}',
            json={'first_name': 'UpdatedName'},
            headers=self.auth_headers
        )
        self.assertEqual(res_put.status_code, 200)
        self.assertEqual(res_put.get_json()['data']['first_name'], 'UpdatedName')

        # 5. Delete student
        res_del = self.client.delete(f'/api/students/{student_db_id}', headers=self.auth_headers)
        self.assertEqual(res_del.status_code, 200)

    def test_face_service_cosine_math(self):
        # Test mathematical cosine similarity calculation
        vec1 = np.random.randn(128).astype(np.float32)
        vec1 /= np.linalg.norm(vec1)

        # Identical vector should give similarity ~ 1.0
        sim_self = face_service.calculate_similarity(vec1.tolist(), vec1.tolist())
        self.assertAlmostEqual(sim_self, 1.0, places=4)

        # Orthogonal vector should give low similarity
        vec2 = -vec1
        sim_opposite = face_service.calculate_similarity(vec1.tolist(), vec2.tolist())
        self.assertLessEqual(sim_opposite, 0.1)

    def test_manual_attendance_and_dashboard_stats(self):
        # Create a student
        student = Student(
            student_id='BCA-999',
            first_name='Aarav',
            last_name='Nair',
            email='aarav.nair@college.edu',
            department='Computer Applications',
            academic_year='3rd Year'
        )
        db.session.add(student)
        db.session.commit()

        # Mark manual attendance
        res_mark = self.client.post('/api/attendance/manual-mark', json={
            'student_id': student.id,
            'status': 'Present',
            'notes': 'Verified test check-in'
        }, headers=self.auth_headers)
        self.assertEqual(res_mark.status_code, 200)

        # Check dashboard stats
        res_stats = self.client.get('/api/dashboard/stats', headers=self.auth_headers)
        self.assertEqual(res_stats.status_code, 200)
        data = res_stats.get_json()['data']
        self.assertEqual(data['overview']['total_students'], 1)
        self.assertEqual(data['overview']['present_today'], 1)
        self.assertEqual(data['overview']['attendance_percentage'], 100.0)

    def test_export_endpoints(self):
        # CSV Export
        res_csv = self.client.get('/api/attendance/export?format=csv', headers=self.auth_headers)
        self.assertEqual(res_csv.status_code, 200)
        self.assertTrue('text/csv' in res_csv.headers.get('Content-Type', ''))

        # Excel Export
        res_xlsx = self.client.get('/api/attendance/export?format=excel', headers=self.auth_headers)
        self.assertEqual(res_xlsx.status_code, 200)
        self.assertTrue('spreadsheetml' in res_xlsx.headers.get('Content-Type', ''))

if __name__ == '__main__':
    unittest.main()
