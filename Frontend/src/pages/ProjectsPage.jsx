import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BriefcaseBusiness, Clock3, Database, Layers3 } from 'lucide-react';
import MetricTile from '../components/MetricTile.jsx';
import OutputPanel from '../components/OutputPanel.jsx';
import PipelineTimeline from '../components/PipelineTimeline.jsx';
import ProjectLookup from '../components/ProjectLookup.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useVideoJob } from '../hooks/useVideoJob.js';
import { readLatestVideoJob, saveLatestVideoJob } from '../utils/storage.js';

const ProjectsPage = () => {
  const [searchParams] = useSearchParams();
  const didLoadFromUrl = useRef(false);
  const {
    projectId,
    jobId,
    queueJobId,
    project,
    status,
    isPolling,
    isFetchingProject,
    startTracking,
    trackExistingJob,
    fetchProject,
    setProjectId,
    setJobId
  } = useVideoJob();

  const hasTrackingTarget = Boolean(projectId || jobId || project);

  const handleFetchProject = async (nextProjectId = projectId) => {
    const normalizedProjectId = nextProjectId.trim();
    if (!normalizedProjectId) return null;

    saveLatestVideoJob({
      projectId: normalizedProjectId,
      jobId,
      queueJobId
    });

    return fetchProject(normalizedProjectId);
  };

  const handleTrackJob = (nextJobId = jobId) => {
    const normalizedJobId = nextJobId.trim();
    if (!normalizedJobId) return;

    saveLatestVideoJob({
      projectId,
      jobId: normalizedJobId,
      queueJobId
    });

    trackExistingJob(normalizedJobId);
  };

  useEffect(() => {
    if (didLoadFromUrl.current) return;

    const savedJob = readLatestVideoJob();
    const nextProjectId = searchParams.get('projectId') || savedJob.projectId || '';
    const nextJobId = searchParams.get('jobId') || savedJob.jobId || '';
    const nextQueueJobId = searchParams.get('queueJobId') || savedJob.queueJobId || '';

    if (!nextProjectId && !nextJobId) {
      didLoadFromUrl.current = true;
      return;
    }

    didLoadFromUrl.current = true;

    if (nextProjectId && nextJobId) {
      startTracking({
        projectId: nextProjectId,
        jobId: nextJobId,
        queueJobId: nextQueueJobId
      });
      return;
    }

    if (nextProjectId) {
      setProjectId(nextProjectId);
      fetchProject(nextProjectId);
    }

    if (nextJobId) {
      setJobId(nextJobId);
      trackExistingJob(nextJobId);
    }
  }, [fetchProject, searchParams, setJobId, setProjectId, startTracking, trackExistingJob]);

  return (
    <div className="space-y-5">
      <ProjectLookup
        projectId={projectId}
        jobId={jobId}
        onProjectIdChange={setProjectId}
        onJobIdChange={setJobId}
        onFetchProject={handleFetchProject}
        onTrackJob={handleTrackJob}
      />

      <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">Project tracking</p>
            <h1 className="mt-2 text-2xl font-semibold text-ink">Generated Video Output</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
              Track queue progress, inspect generated assets, and open the final rendered video.
            </p>
          </div>
          {status !== 'idle' ? <StatusBadge status={status} /> : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="Project" value={projectId ? 'Tracked' : 'None'} icon={BriefcaseBusiness} />
          <MetricTile label="Job" value={jobId ? 'Created' : 'None'} icon={Database} tone="text-coral" />
          <MetricTile label="Queue" value={queueJobId ? 'Linked' : 'Waiting'} icon={Layers3} tone="text-gold" />
          <MetricTile label="Polling" value={isPolling ? 'Active' : 'Idle'} icon={Clock3} tone="text-blue-700" />
        </div>
      </div>

      {hasTrackingTarget ? (
        <>
          <PipelineTimeline status={status} />
          <OutputPanel project={project} jobId={jobId} />
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-line bg-white p-6 text-center shadow-sm">
          <h2 className="text-base font-semibold text-ink">No project selected yet</h2>
          <p className="mt-2 text-sm text-steel">
            Start a generation from Create Video, or paste an existing Project ID / Job ID above to track it here.
          </p>
        </div>
      )}

      {isFetchingProject ? (
        <p className="rounded-lg border border-line bg-white px-4 py-3 text-sm text-steel shadow-sm">
          Loading project details...
        </p>
      ) : null}
    </div>
  );
};

export default ProjectsPage;
