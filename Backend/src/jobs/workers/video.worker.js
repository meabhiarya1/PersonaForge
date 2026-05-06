import { Worker } from 'bullmq';
import { connectDB } from '../../config/db.js';
import logger from '../../config/logger.js';
import { redisConnection } from '../../config/redis.js';
import { VIDEO_QUEUE_NAME } from '../queues/video.queue.js';
import { generateVideoProcessor } from '../processors/generateVideo.processor.js';

await connectDB();

const worker = new Worker(VIDEO_QUEUE_NAME, generateVideoProcessor, {
  connection: redisConnection,
  concurrency: 1
});

worker.on('completed', (job) => {
  logger.info('VIDEO_JOB_COMPLETED', { queueJobId: job.id });
});

worker.on('failed', (job, error) => {
  logger.error('VIDEO_JOB_FAILED', {
    queueJobId: job?.id,
    error: error.message
  });
});

process.on('SIGTERM', async () => {
  await worker.close();
  await redisConnection.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await worker.close();
  await redisConnection.quit();
  process.exit(0);
});

logger.info('VIDEO_WORKER_STARTED');
