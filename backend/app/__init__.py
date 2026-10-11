import os
from flask import Flask, send_from_directory, jsonify
from app.config import Config
from app.extensions import db, migrate, jwt, cors

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Ensure required directories exist
    os.makedirs(os.path.join(app.root_path, '..', 'instance'), exist_ok=True)
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['STUDENT_PHOTOS_FOLDER'], exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Configure CORS with permissive origins for dev
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    # Static file serving for uploads
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # API Health Check
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'application': 'FaceAttend AI Backend',
            'version': '1.0.0',
            'database': 'connected'
        })

    # Register blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.student_routes import student_bp
    from app.routes.attendance_routes import attendance_bp
    from app.routes.dashboard_routes import dashboard_bp
    from app.routes.settings_routes import settings_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(settings_bp)

    # Database initialization and default admin seeding
    with app.app_context():
        db.create_all()
        from app.models.admin import Admin
        from app.models.setting import Setting
        
        # Seed default admin if none exists
        default_admin = Admin.query.filter_by(username='admin').first()
        if not default_admin:
            admin = Admin(
                username='admin',
                email='admin@faceattend.edu',
                full_name='System Administrator',
                role='admin'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            print(">> Seeded default administrator account: admin / admin123")
            
        # Seed default settings if not exists
        if not Setting.query.filter_by(key='institution_name').first():
            Setting.set_val('institution_name', 'St. Jude College of Computer Applications')
            Setting.set_val('confidence_threshold', '0.60')
            Setting.set_val('late_threshold_time', '09:30')
            Setting.set_val('academic_year', '2025 - 2026')
            
        db.session.commit()

    return app
