import { statusLabels, statusTone } from '../utils/status.js';

const StatusBadge = ({ status = 'queued' }) => {
  const label = statusLabels[status] || status;
  const tone = statusTone[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      <span className="h-2 w-2 rounded-full bg-current status-dot" />
      {label}
    </span>
  );
};

export default StatusBadge;
