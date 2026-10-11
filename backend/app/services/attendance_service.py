from datetime import datetime, date, timedelta, time
from sqlalchemy import func
from app.extensions import db
from app.models.student import Student
from app.models.attendance import Attendance
from app.models.setting import Setting

class AttendanceService:
    @staticmethod
    def get_late_time_threshold():
        """Reads late time threshold from settings or default '09:30'."""
        val = Setting.get_val('late_threshold_time', '09:30')
        try:
            parts = [int(p) for p in val.split(':')]
            return time(parts[0], parts[1])
        except Exception:
            return time(9, 30)

    @classmethod
    def mark_attendance(cls, student, confidence_score=None, verification_method='Facial Recognition', notes=None):
        """
        Marks attendance for the given student for today.
        Guarantees idempotency (returns existing record if already marked today).
        """
        today = date.today()
        now = datetime.now()
        
        # Check if already marked today
        existing = Attendance.query.filter_by(student_id=student.id, date=today).first()
        if existing:
            return {
                'already_marked': True,
                'record': existing.to_dict(),
                'status': existing.status,
                'message': f"{student.full_name} was already marked {existing.status} at {existing.time_in.strftime('%I:%M %p')}"
            }
            
        # Determine status (Present vs Late)
        late_threshold = cls.get_late_time_threshold()
        status = 'Late' if now.time() > late_threshold else 'Present'
        
        new_record = Attendance(
            student_id=student.id,
            date=today,
            time_in=now,
            status=status,
            confidence_score=confidence_score,
            verification_method=verification_method,
            notes=notes
        )
        
        db.session.add(new_record)
        db.session.commit()
        
        return {
            'already_marked': False,
            'record': new_record.to_dict(),
            'status': status,
            'message': f"Successfully marked {student.full_name} as {status}!"
        }

    @staticmethod
    def get_dashboard_statistics():
        """Aggregates all live dashboard KPIs and statistical trends."""
        today = date.today()
        total_students = Student.query.count()
        
        # Today's attendance
        today_records = Attendance.query.filter_by(date=today).all()
        present_count = len([r for r in today_records if r.status in ['Present', 'Late']])
        on_time_count = len([r for r in today_records if r.status == 'Present'])
        late_count = len([r for r in today_records if r.status == 'Late'])
        absent_count = max(0, total_students - present_count)
        
        attendance_percentage = round((present_count / total_students * 100), 1) if total_students > 0 else 0.0
        enrolled_faces_count = Student.query.filter_by(is_face_registered=True).count()
        
        # Recent live activity (last 10 records)
        recent_activity = (
            Attendance.query
            .order_by(Attendance.time_in.desc())
            .limit(10)
            .all()
        )
        
        # Weekly 7-day trend
        weekly_trend = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_str = day.strftime('%a, %b %d')
            short_day = day.strftime('%a')
            
            day_records = Attendance.query.filter_by(date=day).all()
            p_cnt = len([r for r in day_records if r.status in ['Present', 'Late']])
            l_cnt = len([r for r in day_records if r.status == 'Late'])
            a_cnt = max(0, total_students - p_cnt)
            
            weekly_trend.append({
                'date': day.isoformat(),
                'display_date': day_str,
                'day': short_day,
                'present': p_cnt,
                'late': l_cnt,
                'absent': a_cnt,
                'rate': round((p_cnt / total_students * 100), 1) if total_students > 0 else 0.0
            })
            
        # Department breakdown
        dept_counts = (
            db.session.query(Student.department, func.count(Student.id))
            .group_by(Student.department)
            .all()
        )
        
        department_stats = []
        for dept_name, count in dept_counts:
            # How many present today from this department
            present_in_dept = (
                db.session.query(func.count(Attendance.id))
                .join(Student, Attendance.student_id == Student.id)
                .filter(Attendance.date == today, Student.department == dept_name)
                .scalar() or 0
            )
            dept_rate = round((present_in_dept / count * 100), 1) if count > 0 else 0.0
            
            department_stats.append({
                'department': dept_name,
                'total_students': count,
                'present_today': present_in_dept,
                'absent_today': max(0, count - present_in_dept),
                'attendance_rate': dept_rate
            })

        return {
            'overview': {
                'total_students': total_students,
                'present_today': present_count,
                'late_today': late_count,
                'on_time_today': on_time_count,
                'absent_today': absent_count,
                'attendance_percentage': attendance_percentage,
                'enrolled_faces_count': enrolled_faces_count,
                'pending_faces_count': total_students - enrolled_faces_count
            },
            'recent_activity': [r.to_dict() for r in recent_activity],
            'weekly_trend': weekly_trend,
            'department_stats': department_stats
        }

attendance_service = AttendanceService()
