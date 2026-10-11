export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function formatTime(timeString?: string): string {
  if (!timeString) return 'N/A';
  // If time is just "HH:MM:SS"
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
    const [h, m, s] = timeString.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} ${period}`;
  }
  try {
    const d = new Date(timeString);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return timeString;
  }
}

export function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'present':
      return {
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400',
        text: 'text-emerald-400'
      };
    case 'late':
      return {
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400',
        text: 'text-amber-400'
      };
    case 'absent':
      return {
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        dot: 'bg-rose-400',
        text: 'text-rose-400'
      };
    case 'excused':
      return {
        badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        dot: 'bg-blue-400',
        text: 'text-blue-400'
      };
    default:
      return {
        badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        dot: 'bg-slate-400',
        text: 'text-slate-400'
      };
  }
}
