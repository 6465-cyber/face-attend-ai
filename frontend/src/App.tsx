import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentManagementPage } from './pages/StudentManagementPage';
import { FaceRegistrationPage } from './pages/FaceRegistrationPage';
import { LiveScannerPage } from './pages/LiveScannerPage';
import { AttendanceReportsPage } from './pages/AttendanceReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Administrative Dashboard Routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/scanner" element={<LiveScannerPage />} />
            <Route path="/students" element={<StudentManagementPage />} />
            <Route path="/register-face" element={<FaceRegistrationPage />} />
            <Route path="/reports" element={<AttendanceReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
