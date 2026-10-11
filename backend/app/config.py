import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'faceattend-super-secret-key-change-in-prod-2026')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'faceattend-jwt-secret-key-change-in-prod-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86400)))
    
    # SQLite Database location
    db_path = os.path.join(basedir, 'instance', 'faceattend.db')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', f'sqlite:///{db_path}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Upload directories
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    STUDENT_PHOTOS_FOLDER = os.path.join(UPLOAD_FOLDER, 'students')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload size
    
    # Facial recognition settings
    CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', 0.60))
    LATE_THRESHOLD_TIME = os.getenv('LATE_THRESHOLD_TIME', '09:30')
    
    # CORS
    CORS_ORIGINS = [origin.strip() for origin in os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173').split(',')]
