import { useNavigate } from 'react-router-dom';
import GenerationForm from '../components/GenerationForm.jsx';
import { saveLatestVideoJob } from '../utils/storage.js';

const CreateVideoPage = () => {
  const navigate = useNavigate();

  const handleCreated = ({ projectId, jobId, queueJobId }) => {
    saveLatestVideoJob({ projectId, jobId, queueJobId });

    const params = new URLSearchParams({
      projectId,
      jobId
    });

    if (queueJobId) params.set('queueJobId', queueJobId);
    navigate(`/projects?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      <div className="mb-5 rounded-lg border border-line bg-white p-5 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Create Video</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Generate a New Video</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
          Fill the video inputs here. After generation starts, PersonaForge will take you to
          Projects so you can track the pipeline and final output.
        </p>
      </div>

      <GenerationForm onCreated={handleCreated} />
    </div>
  );
};

export default CreateVideoPage;
