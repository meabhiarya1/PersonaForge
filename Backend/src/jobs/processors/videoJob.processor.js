import { checkDIDStatusProcessor } from './checkDIDStatus.processor.js';
import { continueVideoProcessor } from './continueVideo.processor.js';
import { generateVideoProcessor } from './generateVideo.processor.js';

export const videoJobProcessor = async (job) => {
  if (job.name === 'generate-video') return generateVideoProcessor(job);
  if (job.name === 'continue-video') return continueVideoProcessor(job);
  if (job.name === 'check-did-status') return checkDIDStatusProcessor(job);

  throw new Error(`Unsupported video queue job: ${job.name}`);
};
