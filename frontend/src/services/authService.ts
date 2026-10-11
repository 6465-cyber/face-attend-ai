import api from './api';
import { AdminUser } from '../types';

export const authService = {
  async login(username: string, password: string):Promise<{ token: string; user: AdminUser }> {
    const res = await api.post('/auth/login', { username, password });
    const { token, user } = res.data.data;
    localStorage.setItem('faceattend_token', token);
    localStorage.setItem('faceattend_user', JSON.stringify(user));
    return { token, user };
  },

  getCurrentUser(): AdminUser | null {
    const userStr = localStorage.getItem('faceattend_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('faceattend_token');
  },

  logout(): void {
    localStorage.removeItem('faceattend_token');
    localStorage.removeItem('faceattend_user');
    api.post('/auth/logout').catch(() => {});
  },

  async verifySession(): Promise<AdminUser> {
    const res = await api.get('/auth/me');
    const user = res.data.data;
    localStorage.setItem('faceattend_user', JSON.stringify(user));
    return user;
  },

  async changePassword(old_password: string, new_password: string): Promise<void> {
    await api.post('/auth/change-password', { old_password, new_password });
  }
};
