import React, { useState } from 'react';
import { Student } from '../types';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onRecord: (payload: { student_id: string | number; status: string; date?: string; notes?: string }) => Promise<void>;
  preselectedStudent?: Student | null;
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  students,
  onRecord,
  preselectedStudent,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preselectedStudent?.id?.toString() || ''
  );
  const [status, setStatus] = useState<string>('Present');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>('Manual Admin Entry');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (preselectedStudent) {
      setSelectedStudentId(preselectedStudent.id.toString());
    } else if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id.toString());
    }
    setError(null);
  }, [preselectedStudent, students, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Please select a student.');
      return;
    }
    try {
      setLoading(true);
      await onRecord({
        student_id: parseInt(selectedStudentId, 10),
        status,
        date,
        notes,
      });
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to record attendance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-[#11162b] border border-[#1f294d] shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1f294d] flex items-center justify-between bg-[#0b1022]">
          <h2 className="text-base font-bold text-white">Manual Attendance Override</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Student
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.student_id} — {s.full_name} ({s.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Attendance Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Status
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Present', 'Late', 'Absent', 'Excused'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                    status === st
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                      : 'bg-[#0a0d18] border-[#1f294d] text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Administrative Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Validated manual check-in"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-[#1f294d] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#1f294d]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{loading ? 'Submitting...' : 'Record Attendance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
