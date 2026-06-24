import { useEffect, useState } from 'react';
import { BriefcaseBusiness, Clock3, Database, Layers3 } from 'lucide-react';
import { toast } from 'sonner';
import { healthCheck } from './api/videoApi.js';
import GenerationForm from './components/GenerationForm.jsx';
import MetricTile from './components/MetricTile.jsx';
import OutputPanel from './components/OutputPanel.jsx';
import PipelineTimeline from './components/PipelineTimeline.jsx';
import ProjectLookup from './components/ProjectLookup.jsx';
import StatusBadge from './components/StatusBadge.jsx';
import TopBar from './components/TopBar.jsx';
import { useVideoJob } from './hooks/useVideoJob.js';

const App = () => {
  const [apiHealthy, setApiHealthy] = useState(false);
  const {
    projectId,
    jobId,
    queueJobId,
    job,
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

  const runHealthCheck = async () => {
    try {
      await healthCheck();
      setApiHealthy(true);
      toast.success('Backend API is reachable.');
    } catch (error) {
      setApiHealthy(false);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  return (
    <div className="app-surface min-h-screen">
      <TopBar apiHealthy={apiHealthy} onHealthCheck={runHealthCheck} />

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-5">
          <GenerationForm onCreated={startTracking} />
          <ProjectLookup
            projectId={projectId}
            jobId={jobId}
            onProjectIdChange={setProjectId}
            onJobIdChange={setJobId}
            onFetchProject={fetchProject}
            onTrackJob={trackExistingJob}
          />
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-teal">Phase 1 operations</p>
                <h1 className="mt-2 text-2xl font-semibold text-ink">Video Generation Console</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
                  Operational workspace for prompt-to-video jobs, media assets, and render status.
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

          <PipelineTimeline status={status === 'idle' ? 'queued' : status} />

          <OutputPanel project={project} />

          {isFetchingProject ? (
            <p className="rounded-lg border border-line bg-white px-4 py-3 text-sm text-steel shadow-sm">
              Loading project details...
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
};

export default App;
