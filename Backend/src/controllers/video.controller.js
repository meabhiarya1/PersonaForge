import { nanoid } from 'nanoid';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  validateGenerateVideoInput,
  validateInputIntentInput
} from '../validations/video.validation.js';
import { analyzeInputIntent } from '../services/content/contentAnalyzer.service.js';
import { extractSourceMaterial } from '../services/content/sourceExtraction.service.js';
import {
  createVideoProject,
  createVideoJob,
  getVideoProjectById,
  listVideoProjects,
  markProjectFailed
} from '../services/project/project.service.js';
import { addVideoGenerationJob } from '../jobs/queues/video.queue.js';

export const generateVideo = asyncHandler(async (req, res) => {
  const input = validateGenerateVideoInput(req.body);
  const project = await createVideoProject(input);
  const queueJobId = nanoid(16);
  const videoJob = await createVideoJob({
    projectId: project.id,
    queueJobId
  });

  try {
    await addVideoGenerationJob({
      projectId: project.id,
      input,
      queueJobId
    });
  } catch (error) {
    await markProjectFailed({
      projectId: project.id,
      jobId: videoJob.id,
      errorMessage: `Queue submission failed: ${error.message}`
    });
    throw error;
  }

  sendSuccess(
    res,
    'Video generation started',
    {
      projectId: project.id,
      jobId: videoJob.id,
      queueJobId
    },
    202
  );
});

export const checkInputIntent = asyncHandler(async (req, res) => {
  const input = validateInputIntentInput(req.body);
  const alignment = await analyzeInputIntent(input);

  sendSuccess(res, 'Input intent checked', alignment);
});

export const extractSource = asyncHandler(async (req, res) => {
  const extraction = await extractSourceMaterial({
    files: req.files || [],
    pastedText: req.body?.pastedText || ''
  });

  sendSuccess(res, 'Source material extracted', extraction);
});

export const getVideoProject = asyncHandler(async (req, res) => {
  const project = await getVideoProjectById(req.params.projectId);
  sendSuccess(res, 'Video project fetched', project);
});

export const listVideos = asyncHandler(async (req, res) => {
  const projects = await listVideoProjects({
    status: req.query.status,
    limit: req.query.limit
  });

  sendSuccess(res, 'Video projects fetched', projects);
});
