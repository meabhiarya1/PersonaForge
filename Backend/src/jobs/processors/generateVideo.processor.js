import logger from '../../config/logger.js';
import { JOB_STATUS } from '../../constants/jobStatus.js';
import { generateScript } from '../../services/script/script.service.js';
import { generateVoice } from '../../services/voice/voice.service.js';
import { generateAvatar } from '../../services/avatar/avatar.service.js';
import { generateCaptions } from '../../services/caption/caption.service.js';
import { createFinalOutputPath, renderFinalVideo } from '../../services/render/render.service.js';
import { getPublicUrl } from '../../services/storage/storage.service.js';
import { getMediaDuration } from '../../utils/media.js';
import {
  getVideoJobByQueueJobId,
  markProjectFailed,
  updateProjectAndJobStatus
} from '../../services/project/project.service.js';

const setStep = async ({ projectId, jobId, status, updates = {} }) => {
  await updateProjectAndJobStatus({
    projectId,
    jobId,
    status,
    currentStep: status,
    projectData: updates
  });
};

export const generateVideoProcessor = async (job) => {
  const { projectId, input } = job.data;
  const queueJobId = job.id;
  const videoJob = await getVideoJobByQueueJobId(queueJobId);
  const jobId = videoJob.id;

  try {
    await setStep({
      projectId,
      jobId,
      status: JOB_STATUS.PROCESSING
    });

    logger.info('SCRIPT_GENERATION_STARTED', { projectId, queueJobId });
    const scriptData = await generateScript(input);
    await setStep({
      projectId,
      jobId,
      status: JOB_STATUS.SCRIPT_GENERATED,
      updates: { scriptData }
    });
    logger.info('SCRIPT_GENERATION_COMPLETED', { projectId, queueJobId });

    logger.info('VOICE_GENERATION_STARTED', { projectId, queueJobId });
    const audioPath = await generateVoice(scriptData, { duration: input.duration });
    const audioDuration = await getMediaDuration(audioPath);
    const audioUrl = getPublicUrl(audioPath);
    await setStep({
      projectId,
      jobId,
      status: JOB_STATUS.VOICE_GENERATED,
      updates: { audioUrl }
    });
    logger.info('VOICE_GENERATION_COMPLETED', { projectId, queueJobId });

    logger.info('AVATAR_GENERATION_STARTED', { projectId, queueJobId });
    const avatarVideoPath = await generateAvatar({
      audioPath,
      script: scriptData,
      avatarId: input.avatarId
    });
    const avatarVideoUrl = getPublicUrl(avatarVideoPath);
    await setStep({
      projectId,
      jobId,
      status: JOB_STATUS.AVATAR_GENERATED,
      updates: { avatarVideoUrl }
    });
    logger.info('AVATAR_GENERATION_COMPLETED', { projectId, queueJobId });

    logger.info('CAPTION_GENERATION_STARTED', { projectId, queueJobId });
    const captionPath = await generateCaptions(scriptData, audioDuration);
    const captionUrl = getPublicUrl(captionPath);
    await setStep({
      projectId,
      jobId,
      status: JOB_STATUS.CAPTION_GENERATED,
      updates: { captionUrl }
    });
    logger.info('CAPTION_GENERATION_COMPLETED', { projectId, queueJobId });

    logger.info('RENDERING_STARTED', { projectId, queueJobId });
    await setStep({
      projectId,
      jobId,
      status: JOB_STATUS.RENDERING
    });
    const outputPath = await createFinalOutputPath();
    const finalVideoPath = await renderFinalVideo({
      avatarVideoPath,
      captionPath,
      outputPath
    });
    const finalVideoUrl = getPublicUrl(finalVideoPath);
    await setStep({
      projectId,
      jobId,
      status: JOB_STATUS.COMPLETED,
      updates: { finalVideoUrl, errorMessage: null }
    });
    logger.info('RENDERING_COMPLETED', { projectId, queueJobId });

    return { projectId, finalVideoUrl };
  } catch (error) {
    logger.error('VIDEO_GENERATION_FAILED', {
      projectId,
      queueJobId,
      error: error.message
    });

    await markProjectFailed({
      projectId,
      jobId,
      errorMessage: error.message
    });

    throw error;
  }
};
