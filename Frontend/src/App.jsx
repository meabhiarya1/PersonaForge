import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { toast } from 'sonner';
import { healthCheck } from './api/videoApi.js';
import AppLayout from './components/AppLayout.jsx';
import CreateVideoPage from './pages/CreateVideoPage.jsx';
import ProfilesPage from './pages/ProfilesPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';

const App = () => {
  const [apiHealthy, setApiHealthy] = useState(false);

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
    <Routes>
      <Route element={<AppLayout apiHealthy={apiHealthy} onHealthCheck={runHealthCheck} />}>
        <Route index element={<CreateVideoPage />} />
        <Route path="profiles" element={<ProfilesPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
