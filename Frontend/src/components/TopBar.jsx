import { Activity, ExternalLink, Server } from 'lucide-react';

const TopBar = ({ apiHealthy, onHealthCheck }) => {
  const boardUrl = import.meta.env.VITE_BULL_BOARD_URL || 'http://localhost:6001/admin/queues';

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-ink">PersonaForge Studio</p>
            <p className="truncate text-xs text-steel">AI video generation operations</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onHealthCheck}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-ink transition hover:border-teal hover:text-teal"
            aria-label="Check API health"
            title="Check API health"
          >
            <Server className="h-4 w-4" aria-hidden="true" />
          </button>

          <a
            href={boardUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-ink transition hover:border-teal hover:text-teal"
            aria-label="Open Bull Board"
            title="Open Bull Board"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>

          <span
            className={`hidden rounded-full border px-3 py-1 text-xs font-semibold sm:inline-flex ${
              apiHealthy
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            {apiHealthy ? 'API online' : 'API unchecked'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
