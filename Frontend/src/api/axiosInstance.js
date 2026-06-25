import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:6001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong while calling the API.';
    const normalizedError = new Error(message);
    normalizedError.status = error.response?.status;

    return Promise.reject(normalizedError);
  }
);

export default axiosInstance;
