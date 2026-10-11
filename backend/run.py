import os
from app import create_app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    print(f"=====================================================")
    print(f"  FaceAttend AI - Backend Server Running on Port {port}")
    print(f"  Default Admin: admin / admin123")
    print(f"  Health Check:  http://localhost:{port}/api/health")
    print(f"=====================================================")
    app.run(host=host, port=port, debug=True)
