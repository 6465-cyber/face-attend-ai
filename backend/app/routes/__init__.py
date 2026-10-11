from app.routes.auth_routes import auth_bp
from app.routes.student_routes import student_bp
from app.routes.attendance_routes import attendance_bp
from app.routes.dashboard_routes import dashboard_bp
from app.routes.settings_routes import settings_bp

__all__ = ['auth_bp', 'student_bp', 'attendance_bp', 'dashboard_bp', 'settings_bp']
