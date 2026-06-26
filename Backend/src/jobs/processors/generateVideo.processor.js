import logger from '../../config/logger.js';
import env from '../../config/env.js';
import { JOB_STEP, JOB_STEP_STATUS } from '../../constants/jobStep.js';
import { JOB_STATUS } from '../../constants/jobStatus.js';
import { analyzeContent } from '../../services/content/contentAnalyzer.service.js';
import { generateScript } from '../../services/script/script.service.js';
import { generateVoice } from '../../services/voice/voice.service.js';
import { startAvatarGeneration } from '../../services/avatar/avatar.service.js';
import { upsertJobStep } from '../../services/project/jobStep.service.js';
import { getPublicUrl } from '../../services/storage/storage.service.js';
import {
  getVideoJobByQueueJobId,
  markProjectFailed,
  updateProjectAndJobStatus
} from '../../services/project/project.service.js';
import { addDIDStatusCheckJob } from '../queues/video.queue.js';
import { finalizeVideoFromAvatar } from './finalizeVideo.processor.js';

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
  let activeStep = null;

  try {
    await setStep({
      projectId,
      jobId,
      status: JOB_STATUS.PROCESSING
    });

    logger.info('SCRIPT_GENERATION_STARTED', { projectId, queueJobId });
    activeStep = JOB_STEP.SCRIPT;
    await upsertJobStep({
      jobId,
      step: activeStep,
      status: JOB_STEP_STATUS.PROCESSING,
      provider: 'openai',
      startedAt: new Date()
    });
    const analysisData = await analyzeContent(input);
    if (analysisData) {
      await setStep({
        projectId,
        jobId,
        status: JOB_STATUS.PROCESSING,
        updates: { analysisData }
      });
    }
    const scriptData = await generateScript(input, analysisData);
    await upsertJobStep({
      jobId,
      step: activeStep,
      status: JOB_STEP_STATUS.COMPLETED,
      provider: 'openai',
      outputData: { analysisData, scriptData },
      completedAt: new Date()
    });
    await setStep({
      projectId,
      jobId,
      status: JOB_STATUS.SCRIPT_GENERATED,
      updates: { analysisData, scriptData }
    });
    logger.info('SCRIPT_GENERATION_COMPLETED', { projectId, queueJobId });

    logger.info('VOICE_GENERATION_STARTED', { projectId, queueJobId });
    activeStep = JOB_STEP.VOICE;
    await upsertJobStep({
      jobId,
      step: activeStep,
      status: JOB_STEP_STATUS.PROCESSING,
      provider: 'elevenlabs',
      startedAt: new Date()
    });
    const audioPath = await generateVoice(scriptData, { duration: input.duration });
    const audioUrl = getPublicUrl(audioPath);
    await upsertJobStep({
      jobId,
      step: activeStep,
      status: JOB_STEP_STATUS.COMPLETED,
      provider: 'elevenlabs',
      outputData: { audioUrl },
      completedAt: new Date()
    });
    await setStep({
      projectId,
      jobId,
      status: JOB_STATUS.VOICE_GENERATED,
      updates: { audioUrl }
    });
    logger.info('VOICE_GENERATION_COMPLETED', { projectId, queueJobId });

    logger.info('AVATAR_GENERATION_STARTED', { projectId, queueJobId });
    activeStep = JOB_STEP.AVATAR;
    await upsertJobStep({
      jobId,
      step: activeStep,
      status: JOB_STEP_STATUS.PROCESSING,
      provider: 'did',
      startedAt: new Date()
    });
    const avatarGeneration = await startAvatarGeneration({
      audioPath,
      avatarId: input.avatarId,
      projectId,
      jobId
    });

    if (avatarGeneration.status === 'awaiting_result') {
      await upsertJobStep({
        jobId,
        step: activeStep,
        status: JOB_STEP_STATUS.AWAITING_RESULT,
        provider: 'did',
        providerJobId: avatarGeneration.providerJobId,
        outputData: { status: 'created' }
      });
      await setStep({
        projectId,
        jobId,
        status: JOB_STATUS.AWAITING_AVATAR
      });
      await addDIDStatusCheckJob({
        projectId,
        jobId,
        talkId: avatarGeneration.providerJobId,
        attempt: 1,
        delay: env.didFallbackIntervalMs
      });
      logger.info('AVATAR_GENERATION_AWAITING_WEBHOOK', {
        projectId,
        queueJobId,
        talkId: avatarGeneration.providerJobId
      });
      return {
        projectId,
        status: JOB_STATUS.AWAITING_AVATAR,
        talkId: avatarGeneration.providerJobId
      };
    }

    return await finalizeVideoFromAvatar({
      projectId,
      jobId,
      scriptData,
      audioPath,
      avatarVideoPath: avatarGeneration.avatarVideoPath,
      provider: avatarGeneration.provider
    });
  } catch (error) {
    logger.error('VIDEO_GENERATION_FAILED', {
      projectId,
      queueJobId,
      error: error.message
    });

    if (activeStep) {
      await upsertJobStep({
        jobId,
        step: activeStep,
        status: JOB_STEP_STATUS.FAILED,
        errorMessage: error.message,
        completedAt: new Date()
      });
    }

    await markProjectFailed({
      projectId,
      jobId,
      errorMessage: error.message
    });

    throw error;
  }
};
