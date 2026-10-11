from flask import jsonify
from datetime import datetime, date

def api_response(success=True, data=None, message=None, status_code=200):
    """Standardized JSON API response structure."""
    payload = {
        'success': success,
        'status': 'success' if success else 'error',
    }
    if message is not None:
        payload['message'] = message
    if data is not None:
        payload['data'] = data
        
    return jsonify(payload), status_code

def error_response(message, status_code=400, details=None):
    """Standardized JSON error response."""
    payload = {
        'success': False,
        'status': 'error',
        'message': message
    }
    if details:
        payload['details'] = details
    return jsonify(payload), status_code

def format_date(d):
    """Formats date or returns today if None."""
    if d is None:
        return date.today()
    if isinstance(d, (date, datetime)):
        return d if isinstance(d, date) else d.date()
    try:
        return datetime.strptime(str(d).strip(), '%Y-%m-%d').date()
    except Exception:
        return date.today()
