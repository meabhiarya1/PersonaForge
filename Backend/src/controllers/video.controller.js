import { nanoid } from 'nanoid';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { validateGenerateVideoInput } from '../validations/video.validation.js';
import {
  createProject,
  createVideoJob,
  getProjectById
} from '../services/project/project.service.js';
import { addVideoGenerationJob } from '../jobs/queues/video.queue.js';

export const generateVideo = asyncHandler(async (req, res) => {
  const input = validateGenerateVideoInput(req.body);
  const project = await createProject(input);
  const queueJobId = nanoid(16);

  await createVideoJob({
    projectId: project.id,
    queueJobId
  });

  await addVideoGenerationJob({
    projectId: project.id,
    input,
    queueJobId
  });

  sendSuccess(
    res,
    'Video generation started',
    {
      projectId: project.id,
      jobId: queueJobId
    },
    202
  );
});

export const getVideoProject = asyncHandler(async (req, res) => {
  const project = await getProjectById(req.params.projectId);
  sendSuccess(res, 'Video project fetched', project);
});
