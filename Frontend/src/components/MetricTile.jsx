const MetricTile = ({ label, value, icon: Icon, tone = 'text-teal' }) => {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-steel">{label}</p>
        {Icon ? <Icon className={`h-4 w-4 ${tone}`} aria-hidden="true" /> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
};

export default MetricTile;
