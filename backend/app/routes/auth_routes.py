from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
from app.extensions import db
from app.models.admin import Admin
from app.utils.helpers import api_response, error_response

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return error_response('Please provide both username and password.', 400)

    admin = Admin.query.filter_by(username=username).first()
    if not admin or not admin.check_password(password):
        return error_response('Invalid username or password.', 401)

    if not admin.is_active:
        return error_response('Account is disabled. Please contact administrator.', 403)

    # Update last login
    admin.last_login = datetime.utcnow()
    db.session.commit()

    # Create JWT token
    token = create_access_token(identity=str(admin.id))
    
    return api_response(
        data={
            'token': token,
            'user': admin.to_dict()
        },
        message='Login successful!'
    )

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    admin_id = get_jwt_identity()
    admin = db.session.get(Admin, int(admin_id))
    if not admin:
        return error_response('User not found.', 404)
        
    return api_response(data=admin.to_dict())

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    admin_id = get_jwt_identity()
    admin = db.session.get(Admin, int(admin_id))
    if not admin:
        return error_response('User not found.', 404)

    data = request.get_json() or {}
    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')

    if not old_password or not new_password:
        return error_response('Please provide both current and new passwords.', 400)

    if not admin.check_password(old_password):
        return error_response('Current password is incorrect.', 400)

    if len(new_password) < 6:
        return error_response('New password must be at least 6 characters.', 400)

    admin.set_password(new_password)
    db.session.commit()

    return api_response(message='Password updated successfully!')

@auth_bp.route('/logout', methods=['POST'])
def logout():
    return api_response(message='Logged out successfully.')
