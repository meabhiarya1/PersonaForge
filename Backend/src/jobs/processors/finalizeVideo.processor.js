import logger from '../../config/logger.js';
import { JOB_STEP, JOB_STEP_STATUS } from '../../constants/jobStep.js';
import { JOB_STATUS } from '../../constants/jobStatus.js';
import { generateCaptions } from '../../services/caption/caption.service.js';
import { upsertJobStep } from '../../services/project/jobStep.service.js';
import { updateProjectAndJobStatus } from '../../services/project/project.service.js';
import { createFinalOutputPath, renderFinalVideo } from '../../services/render/render.service.js';
import { getPublicUrl } from '../../services/storage/storage.service.js';
import { getMediaDuration } from '../../utils/media.js';

const setStatus = async ({ projectId, jobId, status, updates = {}, jobData = {} }) => {
  await updateProjectAndJobStatus({
    projectId,
    jobId,
    status,
    currentStep: status,
    projectData: updates,
    jobData
  });
};

export const finalizeVideoFromAvatar = async ({
  projectId,
  jobId,
  scriptData,
  audioPath,
  avatarVideoPath,
  provider = 'did',
  providerJobId = null
}) => {
  const avatarVideoUrl = getPublicUrl(avatarVideoPath);
  await upsertJobStep({
    jobId,
    step: JOB_STEP.AVATAR,
    status: JOB_STEP_STATUS.COMPLETED,
    provider,
    providerJobId,
    outputData: { avatarVideoUrl },
    errorMessage: null,
    completedAt: new Date()
  });
  await setStatus({
    projectId,
    jobId,
    status: JOB_STATUS.AVATAR_GENERATED,
    updates: { avatarVideoUrl, errorMessage: null },
    jobData: { errorMessage: null }
  });

  logger.info('CAPTION_GENERATION_STARTED', { projectId, jobId });
  await upsertJobStep({
    jobId,
    step: JOB_STEP.CAPTION,
    status: JOB_STEP_STATUS.PROCESSING,
    provider: 'local',
    startedAt: new Date()
  });
  const audioDuration = await getMediaDuration(audioPath);
  const captionPath = await generateCaptions(scriptData, audioDuration);
  const captionUrl = getPublicUrl(captionPath);
  await upsertJobStep({
    jobId,
    step: JOB_STEP.CAPTION,
    status: JOB_STEP_STATUS.COMPLETED,
    provider: 'local',
    outputData: { captionUrl },
    completedAt: new Date()
  });
  await setStatus({
    projectId,
    jobId,
    status: JOB_STATUS.CAPTION_GENERATED,
    updates: { captionUrl }
  });
  logger.info('CAPTION_GENERATION_COMPLETED', { projectId, jobId });

  logger.info('RENDERING_STARTED', { projectId, jobId });
  await upsertJobStep({
    jobId,
    step: JOB_STEP.RENDER,
    status: JOB_STEP_STATUS.PROCESSING,
    provider: 'ffmpeg',
    startedAt: new Date()
  });
  await setStatus({ projectId, jobId, status: JOB_STATUS.RENDERING });
  const outputPath = await createFinalOutputPath();
  const finalVideoPath = await renderFinalVideo({ avatarVideoPath, captionPath, outputPath });
  const finalVideoUrl = getPublicUrl(finalVideoPath);
  await upsertJobStep({
    jobId,
    step: JOB_STEP.RENDER,
    status: JOB_STEP_STATUS.COMPLETED,
    provider: 'ffmpeg',
    outputData: { finalVideoUrl },
    completedAt: new Date()
  });
  await setStatus({
    projectId,
    jobId,
    status: JOB_STATUS.COMPLETED,
    updates: { finalVideoUrl, errorMessage: null },
    jobData: { errorMessage: null }
  });
  logger.info('RENDERING_COMPLETED', { projectId, jobId });

  return { projectId, finalVideoUrl };
};
