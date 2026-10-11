import React, { useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';
import { authService } from '../services/authService';
import { SystemSettings } from '../types';
import {
  Settings,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  Lock,
  Sparkles,
  Building,
  Clock,
  Cpu
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    institution_name: 'St. Jude College of Computer Applications',
    confidence_threshold: '0.60',
    late_threshold_time: '09:30',
    camera_index: '0',
    academic_year: '2025 - 2026',
    auto_attendance_cooldown_seconds: '15'
  });

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Seeder state
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await settingsService.getSettings();
        setSettings((prev) => ({ ...prev, ...data }));
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSettingsMsg(null);
      await settingsService.updateSettings(settings);
      setSettingsMsg('System configuration saved successfully!');
      setTimeout(() => setSettingsMsg(null), 3500);
    } catch (err) {
      console.error('Error updating settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    try {
      setPasswordLoading(true);
      await authService.changePassword(oldPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setPasswordMsg({ type: 'error', text: e.response?.data?.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSeedData = async () => {
    if (!window.confirm('Populate realistic demo student and attendance data for evaluation?')) return;
    try {
      setSeeding(true);
      setSeedMsg(null);
      const res = await settingsService.seedSampleData();
      setSeedMsg(res.message);
    } catch (err) {
      console.error('Seed error:', err);
      setSeedMsg('Failed to run database seeder.');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <span>System Settings & Configuration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Adjust facial recognition thresholds, late schedule cutoff times, and administrator credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General System & Biometrics Settings */}
        <div className="rounded-3xl bg-[#11162b] border border-[#1f294d] p-6 space-y-5 shadow-xl">
          <div className="flex items-center space-x-2 text-white font-bold text-sm">
            <Building className="w-4 h-4 text-indigo-400" />
            <span>Academic Institution & Timings</span>
          </div>

          {settingsMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{settingsMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                College / Institution Name
              </label>
              <input
                type="text"
                value={settings.institution_name}
                onChange={(e) => setSettings({ ...settings, institution_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Academic Session
              </label>
              <input
                type="text"
                value={settings.academic_year}
                onChange={(e) => setSettings({ ...settings, academic_year: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Late Check-In Cutoff Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={settings.late_threshold_time}
                    onChange={(e) => setSettings({ ...settings, late_threshold_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Arrivals after this time mark as 'Late'</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Biometric Match Threshold
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.4"
                  max="0.9"
                  value={settings.confidence_threshold}
                  onChange={(e) => setSettings({ ...settings, confidence_threshold: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Default cosine similarity cutoff (0.60)</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSettings ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Admin Password Change Panel */}
        <div className="rounded-3xl bg-[#11162b] border border-[#1f294d] p-6 space-y-5 shadow-xl">
          <div className="flex items-center space-x-2 text-white font-bold text-sm">
            <Lock className="w-4 h-4 text-purple-400" />
            <span>Administrator Security</span>
          </div>

          {passwordMsg && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {passwordMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Current administrator password"
                className="w-full px-3 py-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3 py-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md shadow-purple-600/30 transition-all disabled:opacity-50"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{passwordLoading ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Academic Evaluation Demo Data Seeder */}
      <div className="rounded-3xl bg-gradient-to-r from-[#11162b] to-[#0e142e] border border-indigo-500/30 p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>BCA Evaluation Demo Data Seeder</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Quickly seed realistic student enrollments and 7 days of attendance history into SQLite. Useful for final-year project examiners and live demonstrations!
            </p>
          </div>
          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 shrink-0"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{seeding ? 'Populating Database...' : 'Seed Sample Academic Records'}</span>
          </button>
        </div>
        {seedMsg && (
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{seedMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
