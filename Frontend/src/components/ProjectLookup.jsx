import { Search } from 'lucide-react';
import { toast } from 'sonner';

const inputClass =
  'w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/10';

const ProjectLookup = ({
  projectId,
  jobId,
  onProjectIdChange,
  onJobIdChange,
  onFetchProject,
  onTrackJob
}) => {
  const handleProjectFetch = async () => {
    if (!projectId.trim()) {
      toast.error('Enter a project ID first.');
      return;
    }

    await onFetchProject(projectId.trim());
  };

  const handleJobTrack = () => {
    if (!jobId.trim()) {
      toast.error('Enter a job ID first.');
      return;
    }

    onTrackJob(jobId);
  };

  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-ink">Lookup</h2>
      <p className="mt-1 text-sm text-steel">Load a project or keep the latest generated IDs handy.</p>

      <div className="mt-4 grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-ink">Project ID</span>
          <div className="flex gap-2">
            <input
              className={inputClass}
              value={projectId}
              onChange={(event) => onProjectIdChange(event.target.value)}
              placeholder="project-uuid"
            />
            <button
              type="button"
              onClick={handleProjectFetch}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-mist text-ink transition hover:border-teal hover:text-teal"
              aria-label="Fetch project"
              title="Fetch project"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-ink">Job ID</span>
          <div className="flex gap-2">
            <input
              className={inputClass}
              value={jobId}
              onChange={(event) => onJobIdChange(event.target.value)}
              placeholder="mysql-job-uuid"
            />
            <button
              type="button"
              onClick={handleJobTrack}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-mist text-ink transition hover:border-teal hover:text-teal"
              aria-label="Track job"
              title="Track job"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </label>
      </div>
    </div>
  );
};

export default ProjectLookup;
