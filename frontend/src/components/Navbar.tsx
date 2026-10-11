import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Scan, 
  LogOut, 
  User, 
  Clock, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-[#1f294d] bg-[#0b1022]/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between">
      {/* Left: Branding & Academic Tag */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Scan className="w-5 h-5 text-white animate-pulse-subtle" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-white flex items-center">
                FaceAttend <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 ml-1">AI</span>
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v1.0 • BCA Project
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Real-Time Biometric Attendance Management System
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls: Live Clock, Quick Launch, User Profile */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Live Clock Card */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#11162b] border border-[#1f294d] text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
          <div className="font-mono font-medium">{currentTime}</div>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">{currentDate}</span>
        </div>

        {/* Quick Launch Scanner Button */}
        <Link
          to="/scanner"
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Launch Live Scanner</span>
          <span className="sm:hidden">Scanner</span>
        </Link>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 p-1.5 rounded-xl bg-[#11162b] border border-[#1f294d] hover:border-indigo-500/40 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="text-left hidden lg:block pr-1">
              <div className="text-xs font-medium text-slate-200 leading-tight">
                {user?.full_name || 'Administrator'}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                {user?.role || 'Admin'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#11162b] border border-[#1f294d] shadow-xl py-1 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-[#1f294d]">
                <p className="text-xs font-semibold text-white">{user?.full_name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <Link
                to="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-indigo-600/10 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Account & Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
