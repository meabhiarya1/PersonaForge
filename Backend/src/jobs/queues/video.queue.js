import { Queue } from 'bullmq';
import { redisConnection } from '../../config/redis.js';

export const VIDEO_QUEUE_NAME = 'video-generation';

export const videoQueue = new Queue(VIDEO_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: false,
    removeOnFail: false
  }
});

export const addVideoGenerationJob = async ({ projectId, input, queueJobId }) => {
  await videoQueue.add(
    'generate-video',
    {
      projectId: projectId.toString(),
      input
    },
    { jobId: queueJobId }
  );

  return queueJobId;
};

export const addVideoContinuationJob = async ({ projectId, jobId, talkId }) => {
  const queueJobId = `continue-did-${talkId}`;
  await videoQueue.add(
    'continue-video',
    { projectId, jobId, talkId },
    { jobId: queueJobId }
  );
  return queueJobId;
};

export const addDIDStatusCheckJob = async ({ projectId, jobId, talkId, attempt = 1, delay }) => {
  const queueJobId = `check-did-${talkId}-${attempt}`;
  await videoQueue.add(
    'check-did-status',
    { projectId, jobId, talkId, attempt },
    { jobId: queueJobId, delay }
  );
  return queueJobId;
};
