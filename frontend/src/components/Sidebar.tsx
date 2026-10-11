import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Camera, 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  Settings,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/scanner',
      label: 'Live Face Scanner',
      icon: Camera,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse',
    },
    {
      to: '/students',
      label: 'Student Directory',
      icon: Users,
      badge: null,
    },
    {
      to: '/register-face',
      label: 'Face Registration',
      icon: UserPlus,
      badge: 'AI',
      badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    },
    {
      to: '/reports',
      label: 'Attendance Reports',
      icon: FileSpreadsheet,
      badge: null,
    },
    {
      to: '/settings',
      label: 'System Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 border-r border-[#1f294d] bg-[#0b1022] flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Navigation Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-white border border-indigo-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#11162b]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center space-x-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Academic System Card */}
      <div className="p-4 border-t border-[#1f294d] bg-[#0a0d18]/50">
        <div className="p-3 rounded-xl bg-gradient-to-b from-[#11162b] to-[#0d1224] border border-[#1f294d] space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-[11px] font-semibold text-indigo-300">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Biometric Engine</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            OpenCV Cosine Biometrics & Automatic Attendance Dispatcher
          </p>
          <div className="pt-1 flex items-center space-x-1 text-[10px] text-slate-500">
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            <span>Encrypted SQLite Backend</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
