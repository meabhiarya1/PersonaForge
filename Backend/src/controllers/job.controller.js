import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { getVideoJobById } from '../services/project/project.service.js';

export const getJobStatus = asyncHandler(async (req, res) => {
  const videoJob = await getVideoJobById(req.params.jobId);
  sendSuccess(res, 'Video job fetched', videoJob);
});
