import { Check, Loader2 } from 'lucide-react';
import { pipelineSteps, statusLabels } from '../utils/status.js';

const PipelineTimeline = ({ status = 'queued' }) => {
  const activeIndex = Math.max(0, pipelineSteps.indexOf(status));
  const failed = status === 'failed';

  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Generation Pipeline</h2>
          <p className="mt-1 text-sm text-steel">Live progress from queue to rendered video.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {pipelineSteps.map((step, index) => {
          const complete = !failed && index < activeIndex;
          const active = !failed && index === activeIndex;

          return (
            <div
              key={step}
              className={`rounded-lg border p-3 ${
                complete
                  ? 'border-teal/30 bg-teal/5'
                  : active
                    ? 'border-gold/30 bg-amber-50'
                    : 'border-line bg-mist/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    complete
                      ? 'bg-teal text-white'
                      : active
                        ? 'bg-gold text-white'
                        : 'bg-white text-steel ring-1 ring-line'
                  }`}
                >
                  {active ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : complete ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </span>
                <p className="min-w-0 text-sm font-semibold text-ink">{statusLabels[step]}</p>
              </div>
            </div>
          );
        })}
      </div>

      {failed ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          The job failed. Check the project error message and Bull Board job details.
        </p>
      ) : null}
    </div>
  );
};

export default PipelineTimeline;
