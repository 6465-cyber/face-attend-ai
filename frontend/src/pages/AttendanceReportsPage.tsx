import React, { useState, useEffect } from 'react';
import { attendanceService } from '../services/attendanceService';
import { AttendanceRecord } from '../types';
import { formatDate, formatTime, getStatusColor } from '../utils/formatters';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText
} from 'lucide-react';

export const AttendanceReportsPage: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [department, setDepartment] = useState('All');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let sd: string | undefined = undefined;
      let ed: string | undefined = undefined;
      let singleDate: string | undefined = undefined;

      const todayStr = new Date().toISOString().slice(0, 10);

      if (dateFilter === 'today') {
        singleDate = 'today';
      } else if (dateFilter === 'yesterday') {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        singleDate = yest.toISOString().slice(0, 10);
      } else if (dateFilter === 'last7') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        sd = d.toISOString().slice(0, 10);
        ed = todayStr;
      } else if (dateFilter === 'custom') {
        sd = startDate || undefined;
        ed = endDate || undefined;
      }

      const data = await attendanceService.getLogs({
        date: singleDate,
        start_date: sd,
        end_date: ed,
        department: department !== 'All' ? department : undefined,
        status: status !== 'All' ? status : undefined,
        search: search.trim() || undefined,
      });

      setRecords(data);
    } catch (err) {
      console.error('Failed to fetch attendance logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [dateFilter, department, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords();
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      setExporting(true);
      await attendanceService.downloadExport(format, {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        department: department !== 'All' ? department : undefined,
        status: status !== 'All' ? status : undefined,
      });
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this attendance record?')) return;
    try {
      await attendanceService.deleteRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Delete attendance error:', err);
    }
  };

  // Quick summary counts
  const presentCount = records.filter((r) => r.status === 'Present').length;
  const lateCount = records.filter((r) => r.status === 'Late').length;
  const totalCount = records.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>Attendance Reports & Audit Logs</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {records.length} Logs
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Query historical biometric logs, filter departmental attendance, and export certified records.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#11162b] border border-[#1f294d] hover:border-cyan-500 text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50 hover:scale-[1.02]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Generating Report...' : 'Export Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip for Current Filter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#11162b] border border-[#1f294d]">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Filtered Logs</span>
          <div className="text-xl font-bold text-white mt-1">{totalCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#11162b] border border-[#1f294d]">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase">On-Time (Present)</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">{presentCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#11162b] border border-[#1f294d]">
          <span className="text-[11px] font-semibold text-amber-400 uppercase">Late Arrivals</span>
          <div className="text-xl font-bold text-amber-400 mt-1">{lateCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#11162b] border border-[#1f294d]">
          <span className="text-[11px] font-semibold text-indigo-400 uppercase">Pandas Engine</span>
          <div className="text-xs font-mono text-slate-300 mt-2">Active (.csv & .xlsx)</div>
        </div>
      </div>

      {/* Filter and Query Controls */}
      <div className="rounded-2xl bg-[#11162b] border border-[#1f294d] p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search student name or roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Quick Date Range */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today Only</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Departments</option>
              <option value="Computer Applications">Computer Applications</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Data Science">Data Science</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="Excused">Excused</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="submit"
              className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={fetchRecords}
              className="p-2 rounded-xl bg-[#0a0d18] border border-[#1f294d] text-slate-400 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Custom Date Pickers */}
        {dateFilter === 'custom' && (
          <div className="pt-2 border-t border-[#1f294d]/60 flex items-center space-x-3 text-xs">
            <span className="text-slate-400">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[#0a0d18] border border-[#1f294d] text-white text-xs"
            />
            <span className="text-slate-400">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[#0a0d18] border border-[#1f294d] text-white text-xs"
            />
            <button
              type="button"
              onClick={fetchRecords}
              className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
            >
              Update Range
            </button>
          </div>
        )}
      </div>

      {/* Attendance Records Table */}
      <div className="rounded-2xl bg-[#11162b] border border-[#1f294d] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1022] text-slate-400 font-semibold border-b border-[#1f294d]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Check-In Time</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f294d]/50 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    <div className="w-6 h-6 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading attendance records...</span>
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((r) => {
                  const statusStyle = getStatusColor(r.status);
                  return (
                    <tr key={r.id} className="hover:bg-[#161d38]/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {formatDate(r.date)}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {r.student?.full_name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-400">
                        {r.student?.student_id || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {r.student?.department || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-200">
                        {formatTime(r.time_in)}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400">
                        {r.confidence_percentage}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {r.verification_method}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusStyle.dot}`} />
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    No attendance records found matching this filter query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
