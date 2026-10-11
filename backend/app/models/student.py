from datetime import datetime
import json
from app.extensions import db

class Student(db.Model):
    __tablename__ = 'students'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(25), nullable=True)
    department = db.Column(db.String(100), nullable=False, default='Computer Applications')
    academic_year = db.Column(db.String(50), nullable=False, default='3rd Year')
    semester = db.Column(db.String(50), nullable=True, default='Semester 6')
    section = db.Column(db.String(20), nullable=True, default='A')
    gender = db.Column(db.String(20), nullable=True, default='Other')
    photo_url = db.Column(db.String(255), nullable=True)
    
    # Facial recognition vector data (JSON string of 128-D embedding float array or list of arrays)
    face_embedding = db.Column(db.Text, nullable=True)
    is_face_registered = db.Column(db.Boolean, default=False, nullable=False)
    face_registered_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    attendances = db.relationship('Attendance', backref='student', lazy=True, cascade='all, delete-orphan')

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def get_embedding(self):
        """Returns embedding as a python list of floats, or None."""
        if not self.face_embedding:
            return None
        try:
            return json.loads(self.face_embedding)
        except Exception:
            return None

    def set_embedding(self, embedding_list):
        """Sets embedding from python list or numpy array."""
        if embedding_list is None:
            self.face_embedding = None
            self.is_face_registered = False
            self.face_registered_at = None
        else:
            self.face_embedding = json.dumps(embedding_list)
            self.is_face_registered = True
            self.face_registered_at = datetime.utcnow()

    def to_dict(self, include_embedding=False):
        data = {
            'id': self.id,
            'student_id': self.student_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone or '',
            'department': self.department,
            'academic_year': self.academic_year,
            'semester': self.semester or '',
            'section': self.section or '',
            'gender': self.gender or '',
            'photo_url': self.photo_url or '',
            'is_face_registered': self.is_face_registered,
            'face_registered_at': self.face_registered_at.isoformat() if self.face_registered_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_embedding and self.face_embedding:
            data['face_embedding'] = self.get_embedding()
        return data
