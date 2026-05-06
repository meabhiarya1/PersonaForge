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
