# FaceAttend AI — Real-Time Facial Recognition Attendance Management System
### BCA Final-Year Academic Capstone Project

**FaceAttend AI** is a modern, production-ready, full-stack biometric attendance management system built for educational institutions and corporate campuses. It leverages real-time webcam video stream processing, OpenCV computer vision biometrics, deep 128-dimensional cosine feature embeddings, and a responsive React + Tailwind CSS dashboard to automate attendance marking with zero contact and anti-duplicate protection.

---

## 🚀 Key Features

1. **Administrator Authentication (JWT)**
   - Secure login portal with JSON Web Tokens.
   - Default Administrator: `admin` / `admin123`.
   - Session verification and password management.

2. **Executive Attendance Command Center (Dashboard)**
   - Live KPI cards: Total Registered Students, Students Present Today, Students Absent, Campus Turnout Rate.
   - 7-Day Attendance Trajectory (Recharts Area Chart).
   - Departmental Turnout Breakdown (Recharts Donut Chart).
   - Real-time recent biometric check-in telemetry feed.

3. **Live Facial Recognition Attendance Scanner**
   - Live webcam feed with high-tech HUD bounding box canvas overlay.
   - Automated face detection using OpenCV with CLAHE illumination normalization.
   - 128-D biometric cosine similarity matching against database enrollments.
   - **Anti-Duplicate & Cooldown Protection**: Automatically detects if a student is already marked present today.
   - Dual audio feedback: Synthesized Web Audio API success chime and informative tone.
   - Live Session Counter and real-time attendance stream sidebar.
   - Sensitivity threshold adjustment slider (0.45 - 0.80).
   - Manual entry override modal for special accommodations.

4. **Biometric Face Registration Studio**
   - Live camera enrollment viewport with oval framing guide.
   - Multi-sample capture support (up to 3 samples) to increase lighting tolerance.
   - L2 unit normalized embedding generation stored directly in SQLite.
   - Immediate audio shutter feedback and celebration confetti upon enrollment.

5. **Student Biometric Directory**
   - Full CRUD operations: Add, Edit, Delete (with confirmation modal), View Profile.
   - Search by roll number, name, or email.
   - Multi-dimensional filters: Department, Academic Year, Face Registration Status.
   - Direct shortcut to enroll biometrics for pending students.

6. **Attendance Reports & Audit Logs**
   - Historical check-in tables with student profile, time in, confidence score, and verification method.
   - Date range filters: Today, Yesterday, Last 7 Days, or Custom Date Range.
   - **Pandas Data Engine Exports**: One-click download of attendance reports in **CSV** or Microsoft Excel (**`.xlsx`**).

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Bundler & Tooling**: Vite
- **Styling**: Tailwind CSS (Dark navy, purple, and blue theme with glassmorphism)
- **Icons**: Lucide React
- **Analytics & Data Visualization**: Recharts
- **Audio Synthesizer**: Web Audio API (zero external sound file dependencies)
- **API Client**: Axios with JWT interceptors
- **Animation & Confetti**: Canvas Confetti

### Backend
- **Language**: Python 3.11 - 3.14 compatible
- **Framework**: Flask & Flask-CORS
- **Authentication**: Flask-JWT-Extended
- **Database & ORM**: SQLite & SQLAlchemy (with Flask-Migrate)
- **Computer Vision & AI**: OpenCV (`opencv-python`), NumPy
- **Biometric Pipeline**: Haar cascade face localization + CLAHE contrast balancing + 2D DCT geometry + 128-D normalized cosine similarity matching
- **Data Reports**: Pandas & OpenPyXL (Excel & CSV exports)

---

## 📁 Project Structure

```
faceattend-ai/
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, StatCard, FaceOverlayCanvas, Modals
│   │   ├── hooks/              # useAuth, useWebcam
│   │   ├── layouts/            # DashboardLayout
│   │   ├── pages/              # Login, Dashboard, Scanner, Students, Register, Reports, Settings
│   │   ├── services/           # Axios API services (auth, student, attendance, settings)
│   │   ├── types/              # TypeScript interfaces
│   │   ├── utils/              # Web Audio API chime synthesizer, formatters, cn
│   │   ├── App.tsx             # React Router configuration
│   │   ├── main.tsx            # DOM root mounting
│   │   └── index.css           # Tailwind CSS directives
│   ├── index.html              # App entry point with Plus Jakarta Sans typography
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/
│   ├── app/
│   │   ├── models/             # Admin, Student, Attendance, Setting SQLAlchemy models
│   │   ├── routes/             # Auth, Student, Attendance, Dashboard, Settings endpoints
│   │   ├── services/           # FaceRecognitionService, AttendanceService, ExportService
│   │   ├── utils/              # Helpers & image processing
│   │   ├── config.py           # App configuration & JWT settings
│   │   └── extensions.py       # SQLAlchemy, JWT, Migrate, CORS
│   ├── tests/                  # Automated API test suite
│   ├── seed_db.py              # Sample academic students and 7-day attendance seeder
│   ├── run.py                  # Flask backend entry point
│   ├── requirements.txt
│   └── .env
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.11, 3.12, 3.13, and 3.14)
- Node.js 18+ and npm

### 2. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python run.py
```
> The backend server will automatically create the database, tables, and seed the default administrator account (`admin` / `admin123`) at `http://127.0.0.1:5000`.

To seed sample students and 7 days of attendance history for academic demonstration:
```bash
python seed_db.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
> Open your browser at `http://localhost:5173`.

---

## 🔑 Default Credentials

- **Username**: `enter username`
- **Password**: `enter password`

---

## 🧪 Running Automated Tests
```bash
cd backend
python -m unittest tests/test_api.py
```

---

## 📜 Academic Project Information
- **Course**: Bachelor of Computer Applications (BCA)
- **Project Title**: Real-Time Facial Recognition Attendance Management System
- **Academic Year**: 2025 - 2026
