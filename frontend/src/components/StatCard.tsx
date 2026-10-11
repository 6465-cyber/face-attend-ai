import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorScheme?: 'indigo' | 'emerald' | 'amber' | 'purple' | 'rose' | 'cyan';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'indigo',
}) => {
  const schemeStyles = {
    indigo: {
      border: 'border-indigo-500/20 hover:border-indigo-500/40',
      bgGlow: 'from-indigo-600/10 to-transparent',
      iconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      bgGlow: 'from-emerald-600/10 to-transparent',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      bgGlow: 'from-amber-600/10 to-transparent',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      bgGlow: 'from-purple-600/10 to-transparent',
      iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      bgGlow: 'from-rose-600/10 to-transparent',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    },
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      bgGlow: 'from-cyan-600/10 to-transparent',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    },
  };

  const currentScheme = schemeStyles[colorScheme];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#11162b] border ${currentScheme.border} p-5 transition-all duration-300 hover:shadow-card-dark hover:-translate-y-0.5 group`}
    >
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br ${currentScheme.bgGlow} blur-2xl pointer-events-none`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {value}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${currentScheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        {subtitle && (
          <span className="text-slate-400 truncate max-w-[70%]">
            {subtitle}
          </span>
        )}
        {trend && (
          <span
            className={`font-semibold px-2 py-0.5 rounded-md ${
              trend.isPositive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};
