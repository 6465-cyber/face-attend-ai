export interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login?: string | null;
}

export interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  department: string;
  academic_year: string;
  semester: string;
  section: string;
  gender: string;
  photo_url: string;
  is_face_registered: boolean;
  face_registered_at: string | null;
  created_at: string;
  updated_at: string;
  stats?: {
    total_marked: number;
    present_count: number;
    attendance_percentage: number;
  };
  recent_attendance?: AttendanceRecord[];
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  student?: Student;
  date: string;
  time_in: string;
  time_in_full: string;
  status: 'Present' | 'Late' | 'Absent' | 'Excused';
  confidence_score: number | null;
  confidence_percentage: string;
  verification_method: string;
  notes: string;
  created_at: string;
}

export interface DashboardStats {
  overview: {
    total_students: number;
    present_today: number;
    late_today: number;
    on_time_today: number;
    absent_today: number;
    attendance_percentage: number;
    enrolled_faces_count: number;
    pending_faces_count: number;
  };
  recent_activity: AttendanceRecord[];
  weekly_trend: {
    date: string;
    display_date: string;
    day: string;
    present: number;
    late: number;
    absent: number;
    rate: number;
  }[];
  department_stats: {
    department: string;
    total_students: number;
    present_today: number;
    absent_today: number;
    attendance_rate: number;
  }[];
}

export interface RecognitionResult {
  detected: boolean;
  match_found: boolean;
  student?: Student;
  confidence?: number;
  confidence_percentage?: string;
  box?: [number, number, number, number] | null;
  already_marked?: boolean;
  attendance_status?: string;
  record?: AttendanceRecord;
  message: string;
}

export interface SystemSettings {
  institution_name: string;
  confidence_threshold: string;
  late_threshold_time: string;
  camera_index: string;
  academic_year: string;
  auto_attendance_cooldown_seconds: string;
}
