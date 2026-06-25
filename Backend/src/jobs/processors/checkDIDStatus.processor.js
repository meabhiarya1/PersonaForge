import env from '../../config/env.js';
import { JOB_STEP, JOB_STEP_STATUS } from '../../constants/jobStep.js';
import { addDIDStatusCheckJob } from '../queues/video.queue.js';
import { upsertJobStep } from '../../services/project/jobStep.service.js';
import { markProjectFailed } from '../../services/project/project.service.js';
import { handleDIDTalkUpdate } from '../../services/webhook/didWebhook.service.js';

export const checkDIDStatusProcessor = async (job) => {
  const { projectId, jobId, talkId, attempt } = job.data;
  const result = await handleDIDTalkUpdate(talkId);

  if (result.action !== 'pending') return { talkId, action: result.action };

  const maxAttempts = Math.max(1, Math.ceil(env.didTimeoutMs / env.didFallbackIntervalMs));
  if (attempt >= maxAttempts) {
    const errorMessage = `D-ID Talk ${talkId} did not complete within the fallback window.`;
    await upsertJobStep({
      jobId,
      step: JOB_STEP.AVATAR,
      status: JOB_STEP_STATUS.FAILED,
      provider: 'did',
      providerJobId: talkId,
      errorMessage,
      completedAt: new Date()
    });
    await markProjectFailed({ projectId, jobId, errorMessage });
    return { talkId, action: 'fallback_timeout' };
  }

  await addDIDStatusCheckJob({
    projectId,
    jobId,
    talkId,
    attempt: attempt + 1,
    delay: env.didFallbackIntervalMs
  });
  return { talkId, action: 'next_check_scheduled', attempt: attempt + 1 };
};
