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

export const listVideoProjects = async ({ status, limit } = {}) => {
  const { data } = await axiosInstance.get('/api/videos', {
    params: {
      status,
      limit
    }
  });
  return data.data;
};

export const healthCheck = async () => {
  const { data } = await axiosInstance.get('/health');
  return data;
};

export const listProfiles = async () => {
  const { data } = await axiosInstance.get('/api/profiles');
  return data.data;
};

export const createProfile = async (payload) => {
  const { data } = await axiosInstance.post('/api/profiles', payload);
  return data.data;
};

export const updateProfile = async (profileId, payload) => {
  const { data } = await axiosInstance.patch(`/api/profiles/${profileId}`, payload);
  return data.data;
};

export const deleteProfile = async (profileId) => {
  const { data } = await axiosInstance.delete(`/api/profiles/${profileId}`);
  return data.data;
};
