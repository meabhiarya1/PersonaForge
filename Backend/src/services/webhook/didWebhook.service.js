import { JOB_STEP, JOB_STEP_STATUS } from '../../constants/jobStep.js';
import { JOB_STATUS } from '../../constants/jobStatus.js';
import { addVideoContinuationJob } from '../../jobs/queues/video.queue.js';
import { getDIDTalk } from '../avatar/providers/did.provider.js';
import {
  getJobStepByProviderJobId,
  upsertJobStep
} from '../project/jobStep.service.js';
import {
  getVideoJobById,
  markProjectFailed
} from '../project/project.service.js';

export const handleDIDTalkUpdate = async (talkId) => {
  const avatarStep = await getJobStepByProviderJobId('did', talkId);
  const videoJob = await getVideoJobById(avatarStep.jobId);
  const talk = await getDIDTalk(talkId);

  if (talk.status === 'done' && talk.result_url) {
    if (avatarStep.status === JOB_STEP_STATUS.COMPLETED) {
      return { action: 'already_completed', talk, videoJob };
    }

    await addVideoContinuationJob({
      projectId: videoJob.projectId,
      jobId: videoJob.id,
      talkId
    });
    return { action: 'continuation_queued', talk, videoJob };
  }

  if (talk.status === 'error' || talk.status === 'rejected') {
    const errorMessage = talk.error?.description || `D-ID Talk failed with status ${talk.status}`;
    await upsertJobStep({
      jobId: videoJob.id,
      step: JOB_STEP.AVATAR,
      status: JOB_STEP_STATUS.FAILED,
      provider: 'did',
      providerJobId: talkId,
      outputData: { status: talk.status },
      errorMessage,
      completedAt: new Date()
    });
    await markProjectFailed({
      projectId: videoJob.projectId,
      jobId: videoJob.id,
      errorMessage
    });
    return { action: 'failed', talk, videoJob };
  }

  await upsertJobStep({
    jobId: videoJob.id,
    step: JOB_STEP.AVATAR,
    status: JOB_STEP_STATUS.AWAITING_RESULT,
    provider: 'did',
    providerJobId: talkId,
    outputData: { status: talk.status }
  });

  return { action: 'pending', talk, videoJob };
};
