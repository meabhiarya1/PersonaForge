import logger from '../../config/logger.js';
import { JOB_STEP, JOB_STEP_STATUS } from '../../constants/jobStep.js';
import { completeAvatarGeneration } from '../../services/avatar/avatar.service.js';
import { upsertJobStep } from '../../services/project/jobStep.service.js';
import {
  getVideoProjectById,
  markProjectFailed
} from '../../services/project/project.service.js';
import { getLocalPathFromPublicUrl } from '../../services/storage/storage.service.js';
import { finalizeVideoFromAvatar } from './finalizeVideo.processor.js';

export const continueVideoProcessor = async (job) => {
  const { projectId, jobId, talkId } = job.data;

  try {
    const project = await getVideoProjectById(projectId);
    if (project.status === 'completed') return { projectId, finalVideoUrl: project.finalVideoUrl };

    await upsertJobStep({
      jobId,
      step: JOB_STEP.AVATAR,
      status: JOB_STEP_STATUS.PROCESSING,
      provider: 'did',
      providerJobId: talkId,
      startedAt: new Date()
    });
    const { avatarVideoPath } = await completeAvatarGeneration(talkId);
    const audioPath = getLocalPathFromPublicUrl(project.audioUrl);

    return await finalizeVideoFromAvatar({
      projectId,
      jobId,
      scriptData: project.scriptData,
      audioPath,
      avatarVideoPath,
      provider: 'did',
      providerJobId: talkId
    });
  } catch (error) {
    logger.error('VIDEO_CONTINUATION_FAILED', { projectId, jobId, talkId, error: error.message });
    await upsertJobStep({
      jobId,
      step: JOB_STEP.AVATAR,
      status: JOB_STEP_STATUS.FAILED,
      provider: 'did',
      providerJobId: talkId,
      errorMessage: error.message,
      completedAt: new Date()
    });
    await markProjectFailed({ projectId, jobId, errorMessage: error.message });
    throw error;
  }
};
