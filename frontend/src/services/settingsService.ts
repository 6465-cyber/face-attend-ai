import api from './api';
import { SystemSettings } from '../types';

export const settingsService = {
  async getSettings(): Promise<SystemSettings> {
    const res = await api.get('/settings');
    return res.data.data;
  },

  async updateSettings(data: Partial<SystemSettings>): Promise<void> {
    await api.put('/settings', data);
  },

  async seedSampleData(): Promise<{ message: string }> {
    const res = await api.post('/settings/seed-sample-data');
    return res.data;
  }
};
