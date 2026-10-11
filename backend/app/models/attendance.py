from datetime import datetime, date
from app.extensions import db

class Attendance(db.Model):
    __tablename__ = 'attendances'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, default=date.today, index=True)
    time_in = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    status = db.Column(db.String(20), nullable=False, default='Present')  # Present, Late, Absent, Excused
    confidence_score = db.Column(db.Float, nullable=True)  # e.g., 0.952 (95.2%)
    verification_method = db.Column(db.String(50), default='Facial Recognition')  # Facial Recognition, Manual Admin Override
    notes = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Unique constraint per student per date
    __table_args__ = (
        db.UniqueConstraint('student_id', 'date', name='uq_student_date_attendance'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student': self.student.to_dict() if self.student else None,
            'date': self.date.isoformat() if self.date else None,
            'time_in': self.time_in.strftime('%H:%M:%S') if self.time_in else None,
            'time_in_full': self.time_in.isoformat() if self.time_in else None,
            'status': self.status,
            'confidence_score': round(self.confidence_score, 4) if self.confidence_score is not None else None,
            'confidence_percentage': f"{round(self.confidence_score * 100, 1)}%" if self.confidence_score is not None else 'N/A',
            'verification_method': self.verification_method,
            'notes': self.notes or '',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
