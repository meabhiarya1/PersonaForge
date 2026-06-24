import axiosInstance from './axiosInstance.js';

export const generateVideo = async (payload) => {
  const { data } = await axiosInstance.post('/api/videos/generate', payload);
  return data.data;
};

export const getJobStatus = async (jobId) => {
  const { data } = await axiosInstance.get(`/api/jobs/${jobId}`);
  return data.data;
};

export const getVideoProject = async (projectId) => {
  const { data } = await axiosInstance.get(`/api/videos/${projectId}`);
  return data.data;
};

export const healthCheck = async () => {
  const { data } = await axiosInstance.get('/health');
  return data;
};
