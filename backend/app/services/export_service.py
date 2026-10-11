import io
import pandas as pd
from datetime import datetime
from flask import send_file
from app.models.attendance import Attendance
from app.models.student import Student

class ExportService:
    @staticmethod
    def export_attendance(format_type='csv', start_date=None, end_date=None, department=None, status=None):
        """
        Exports attendance logs to CSV or Excel (.xlsx) using Pandas.
        Filters by date range, department, and attendance status.
        """
        query = Attendance.query.join(Student, Attendance.student_id == Student.id)
        
        if start_date:
            query = query.filter(Attendance.date >= start_date)
        if end_date:
            query = query.filter(Attendance.date <= end_date)
        if department and department.strip() and department != 'All':
            query = query.filter(Student.department == department)
        if status and status.strip() and status != 'All':
            query = query.filter(Attendance.status == status)
            
        records = query.order_by(Attendance.date.desc(), Attendance.time_in.desc()).all()
        
        # Prepare list of dictionaries for Pandas DataFrame
        rows = []
        for r in records:
            s = r.student
            rows.append({
                'Record ID': r.id,
                'Student Roll No': s.student_id if s else 'N/A',
                'Student Name': s.full_name if s else 'N/A',
                'Department': s.department if s else 'N/A',
                'Academic Year': s.academic_year if s else 'N/A',
                'Section': s.section if s else 'N/A',
                'Email': s.email if s else 'N/A',
                'Date': r.date.strftime('%Y-%m-%d') if r.date else '',
                'Check-In Time': r.time_in.strftime('%I:%M:%S %p') if r.time_in else '',
                'Status': r.status,
                'Confidence': f"{round(r.confidence_score * 100, 1)}%" if r.confidence_score else 'N/A',
                'Verification Method': r.verification_method or 'Facial Recognition',
                'Notes': r.notes or ''
            })
            
        df = pd.DataFrame(rows)
        if df.empty:
            df = pd.DataFrame(columns=[
                'Record ID', 'Student Roll No', 'Student Name', 'Department',
                'Academic Year', 'Section', 'Email', 'Date', 'Check-In Time',
                'Status', 'Confidence', 'Verification Method', 'Notes'
            ])
            
        timestamp_str = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if format_type.lower() in ['excel', 'xlsx']:
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Attendance_Log')
            output.seek(0)
            filename = f"FaceAttend_Report_{timestamp_str}.xlsx"
            mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        else:
            # Default to CSV
            output = io.BytesIO()
            df.to_csv(output, index=False, encoding='utf-8')
            output.seek(0)
            filename = f"FaceAttend_Report_{timestamp_str}.csv"
            mimetype = 'text/csv'
            
        return send_file(
            output,
            as_attachment=True,
            download_name=filename,
            mimetype=mimetype
        )

export_service = ExportService()
