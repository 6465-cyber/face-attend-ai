import api from './api';
import { Student } from '../types';

export const studentService = {
  async getStudents(params?: {
    search?: string;
    department?: string;
    year?: string;
    face_status?: string;
  }): Promise<Student[]> {
    const res = await api.get('/students', { params });
    return res.data.data;
  },

  async getStudent(id: number): Promise<Student> {
    const res = await api.get(`/students/${id}`);
    return res.data.data;
  },

  async createStudent(data: Partial<Student>): Promise<Student> {
    const res = await api.post('/students', data);
    return res.data.data;
  },

  async updateStudent(id: number, data: Partial<Student>): Promise<Student> {
    const res = await api.put(`/students/${id}`, data);
    return res.data.data;
  },

  async deleteStudent(id: number): Promise<void> {
    await api.delete(`/students/${id}`);
  },

  async registerFace(id: number, payload: { image?: string; samples?: string[] }): Promise<Student> {
    const res = await api.post(`/students/${id}/register-face`, payload);
    return res.data.data;
  },

  async removeFace(id: number): Promise<Student> {
    const res = await api.delete(`/students/${id}/face`);
    return res.data.data;
  }
};
