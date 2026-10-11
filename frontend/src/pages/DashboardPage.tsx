import React, { useState, useEffect } from 'react';
import { attendanceService } from '../services/attendanceService';
import { DashboardStats } from '../types';
import { StatCard } from '../components/StatCard';
import { formatTime, getStatusColor } from '../utils/formatters';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Camera,
  UserPlus,
  FileSpreadsheet,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const data = await attendanceService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          Calculating Real-Time Attendance Analytics...
        </p>
      </div>
    );
  }

  const { overview, recent_activity, weekly_trend, department_stats } = stats;

  const PIE_COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Page Header & Quick Launchers */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Executive Attendance Command Center
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-ping" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time biometric facial recognition attendance stream and departmental summaries.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="p-2 rounded-xl bg-[#11162b] border border-[#1f294d] text-slate-300 hover:text-white hover:border-indigo-500/40 transition-all disabled:opacity-50"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          <Link
            to="/scanner"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02]"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Launch Live Scanner</span>
          </Link>
        </div>
      </div>

      {/* KPI Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Students"
          value={overview.total_students}
          subtitle={`${overview.enrolled_faces_count} with enrolled facial profiles`}
          icon={Users}
          colorScheme="indigo"
          trend={{
            value: `${overview.enrolled_faces_count}/${overview.total_students} Enrolled`,
            isPositive: true,
          }}
        />

        <StatCard
          title="Students Present Today"
          value={overview.present_today}
          subtitle={`${overview.on_time_today} on-time • ${overview.late_today} late arrivals`}
          icon={CheckCircle2}
          colorScheme="emerald"
          trend={{
            value: `${overview.on_time_today} On-Time`,
            isPositive: true,
          }}
        />

        <StatCard
          title="Students Absent Today"
          value={overview.absent_today}
          subtitle="Unmarked student accounts today"
          icon={XCircle}
          colorScheme="rose"
          trend={{
            value: `${overview.absent_today} Absent`,
            isPositive: false,
          }}
        />

        <StatCard
          title="Today's Attendance Rate"
          value={`${overview.attendance_percentage}%`}
          subtitle="Real-time campus turnout"
          icon={TrendingUp}
          colorScheme="cyan"
          trend={{
            value: overview.attendance_percentage >= 75 ? 'Healthy Turnout' : 'Below Quorum',
            isPositive: overview.attendance_percentage >= 75,
          }}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Attendance Trend (Last 7 Days) */}
        <div className="lg:col-span-2 rounded-2xl bg-[#11162b] border border-[#1f294d] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>7-Day Attendance Trajectory</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Daily present vs late attendance trends
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-slate-400 text-[11px]">Present</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-400 text-[11px]">Late</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f294d" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1022',
                    borderColor: '#1f294d',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="present"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="urlColorPresent"
                />
                <Area
                  type="monotone"
                  dataKey="late"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="urlColorLate"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department-wise Turnout Breakdown */}
        <div className="rounded-2xl bg-[#11162b] border border-[#1f294d] p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Department Turnout</h2>
            <p className="text-[11px] text-slate-400">
              Departmental turnout distribution
            </p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {department_stats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={department_stats}
                    dataKey="present_today"
                    nameKey="department"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {department_stats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b1022',
                      borderColor: '#1f294d',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">No departmental statistics yet.</p>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-[#1f294d]">
            {department_stats.slice(0, 3).map((dept, i) => (
              <div key={dept.department} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 truncate max-w-[70%]">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-slate-300 truncate">{dept.department}</span>
                </div>
                <span className="font-semibold text-white">
                  {dept.attendance_rate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Live Recent Check-Ins & Quick Launch Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Recent Attendance Activity Table */}
        <div className="lg:col-span-2 rounded-2xl bg-[#11162b] border border-[#1f294d] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Recent Biometric Check-Ins</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Real-Time
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Latest facial recognitions confirmed by the system
              </p>
            </div>
            <Link
              to="/reports"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
            >
              <span>View All Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1022] text-slate-400 font-semibold border-b border-[#1f294d]">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">Student</th>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f294d]/50 text-slate-300">
                {recent_activity.length > 0 ? (
                  recent_activity.map((record) => {
                    const statusStyle = getStatusColor(record.status);
                    return (
                      <tr key={record.id} className="hover:bg-[#161d38]/50 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-white flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs uppercase">
                            {record.student?.first_name?.charAt(0) || 'S'}
                          </div>
                          <span className="truncate max-w-[120px] sm:max-w-none">
                            {record.student?.full_name || 'Student'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                          {record.student?.student_id || 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 truncate max-w-[120px]">
                          {record.student?.department || 'General'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">
                          {formatTime(record.time_in)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">
                          {record.confidence_percentage}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusStyle.dot}`} />
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500 text-xs">
                      No attendance activity recorded today yet. Launch the live scanner to begin!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Final Project Panel */}
        <div className="rounded-2xl bg-[#11162b] border border-[#1f294d] p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">System Actions</h2>
            <p className="text-[11px] text-slate-400">
              Quick access shortcuts for administration
            </p>
          </div>

          <div className="space-y-2.5">
            <Link
              to="/scanner"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-900/40 to-purple-900/30 border border-indigo-500/30 hover:border-indigo-400 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-300">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    Launch Face Scanner
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Live webcam biometric recognition
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-300 transition-colors" />
            </Link>

            <Link
              to="/register-face"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0b1022] border border-[#1f294d] hover:border-purple-500/40 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-600/20 text-purple-300">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                    Enroll Student Biometrics
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Capture 128-D face embeddings
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 transition-colors" />
            </Link>

            <Link
              to="/reports"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0b1022] border border-[#1f294d] hover:border-cyan-500/40 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-cyan-600/20 text-cyan-300">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    Export Attendance Records
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Download Excel / CSV reports
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-300 transition-colors" />
            </Link>
          </div>

          {/* Academic Project Info Badge */}
          <div className="p-3 rounded-xl bg-[#070a14] border border-[#1f294d] space-y-1.5 mt-4">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>BCA Academic Capstone Project</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Real-time facial detection and 128-dimensional embedding verification. Connected to Python Flask REST API & SQLite DB.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
