from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.services.attendance_service import attendance_service
from app.utils.helpers import api_response

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    """Returns live database statistics for the administrator dashboard."""
    stats = attendance_service.get_dashboard_statistics()
    return api_response(data=stats)
