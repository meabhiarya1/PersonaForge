import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getJobStatus, getVideoProject } from '../api/videoApi.js';
import { terminalStatuses } from '../utils/status.js';

export const useVideoJob = () => {
  const [projectId, setProjectId] = useState('');
  const [jobId, setJobId] = useState('');
  const [queueJobId, setQueueJobId] = useState('');
  const [job, setJob] = useState(null);
  const [project, setProject] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isFetchingProject, setIsFetchingProject] = useState(false);

  const status = job?.status || project?.status || 'idle';
  const isTerminal = useMemo(() => terminalStatuses.has(status), [status]);

  const startTracking = ({ projectId: nextProjectId, jobId: nextJobId, queueJobId: nextQueueJobId }) => {
    setProjectId(nextProjectId);
    setJobId(nextJobId);
    setQueueJobId(nextQueueJobId || '');
    setJob(null);
    setProject(null);
    setIsPolling(Boolean(nextJobId));
  };

  const trackExistingJob = (nextJobId = jobId) => {
    const normalizedJobId = nextJobId.trim();
    if (!normalizedJobId) return;

    setJobId(normalizedJobId);
    setJob(null);
    setProject(null);
    setQueueJobId('');
    setIsPolling(true);
  };

  const fetchProject = async (id = projectId) => {
    if (!id) return null;

    setIsFetchingProject(true);
    try {
      const nextProject = await getVideoProject(id);
      setProject(nextProject);
      return nextProject;
    } catch (error) {
      toast.error(error.message);
      return null;
    } finally {
      setIsFetchingProject(false);
    }
  };

  useEffect(() => {
    if (!jobId || !isPolling) return undefined;

    let isMounted = true;

    const poll = async () => {
      try {
        const nextJob = await getJobStatus(jobId);
        if (!isMounted) return;

        setJob(nextJob);

        if (nextJob.projectId) {
          const nextProject = await getVideoProject(nextJob.projectId);
          if (isMounted) {
            setProject(nextProject);
          }
        }

        if (terminalStatuses.has(nextJob.status)) {
          setIsPolling(false);
          if (nextJob.status === 'completed') toast.success('Video generation completed.');
          if (nextJob.status === 'failed') toast.error(nextJob.errorMessage || 'Video generation failed.');
        }
      } catch (error) {
        if (isMounted) {
          setIsPolling(false);
          toast.error(error.message);
        }
      }
    };

    poll();
    const intervalId = window.setInterval(poll, 3500);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [jobId, isPolling]);

  return {
    projectId,
    jobId,
    queueJobId,
    job,
    project,
    status,
    isTerminal,
    isPolling,
    isFetchingProject,
    startTracking,
    trackExistingJob,
    fetchProject,
    setProjectId,
    setJobId,
    setQueueJobId
  };
};
