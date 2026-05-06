import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { videoQueue } from '../jobs/queues/video.queue.js';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(videoQueue)],
  serverAdapter
});

export const bullBoardRouter = serverAdapter.getRouter();
