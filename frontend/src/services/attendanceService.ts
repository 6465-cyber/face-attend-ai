import api from './api';
import { AttendanceRecord, DashboardStats, RecognitionResult } from '../types';

export const attendanceService = {
  async recognizeFace(payload: { image: string; threshold?: number }): Promise<RecognitionResult> {
    const res = await api.post('/attendance/recognize', payload);
    return res.data.data;
  },

  async getLogs(params?: {
    date?: string;
    start_date?: string;
    end_date?: string;
    department?: string;
    status?: string;
    search?: string;
  }): Promise<AttendanceRecord[]> {
    const res = await api.get('/attendance/logs', { params });
    return res.data.data;
  },

  async manualMark(payload: {
    student_id: number | string;
    status: string;
    date?: string;
    notes?: string;
  }): Promise<AttendanceRecord> {
    const res = await api.post('/attendance/manual-mark', payload);
    return res.data.data;
  },

  async deleteRecord(id: number): Promise<void> {
    await api.delete(`/attendance/${id}`);
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await api.get('/dashboard/stats');
    return res.data.data;
  },

  getExportUrl(format: 'csv' | 'excel', params?: {
    start_date?: string;
    end_date?: string;
    department?: string;
    status?: string;
  }): string {
    const query = new URLSearchParams();
    query.set('format', format);
    if (params?.start_date) query.set('start_date', params.start_date);
    if (params?.end_date) query.set('end_date', params.end_date);
    if (params?.department && params.department !== 'All') query.set('department', params.department);
    if (params?.status && params.status !== 'All') query.set('status', params.status);

    const base = import.meta.env.VITE_API_BASE_URL || '/api';
    return `${base}/attendance/export?${query.toString()}`;
  },

  async downloadExport(format: 'csv' | 'excel', params?: {
    start_date?: string;
    end_date?: string;
    department?: string;
    status?: string;
  }): Promise<void> {
    const res = await api.get('/attendance/export', {
      params: { format, ...params },
      responseType: 'blob',
    });
    const blob = new Blob([res.data], {
      type: format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FaceAttend_Report_${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : 'csv'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
};
