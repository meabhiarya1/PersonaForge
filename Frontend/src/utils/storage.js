export const latestVideoJobStorageKey = 'personaForge.latestVideoJob';

export const saveLatestVideoJob = ({ projectId, jobId, queueJobId }) => {
  if (typeof window === 'undefined') return;

  window.sessionStorage.setItem(
    latestVideoJobStorageKey,
    JSON.stringify({
      projectId: projectId || '',
      jobId: jobId || '',
      queueJobId: queueJobId || ''
    })
  );
};

export const readLatestVideoJob = () => {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(window.sessionStorage.getItem(latestVideoJobStorageKey) || '{}');
  } catch {
    return {};
  }
};

export const clearLatestVideoJob = () => {
  if (typeof window === 'undefined') return;

  window.sessionStorage.removeItem(latestVideoJobStorageKey);
};
