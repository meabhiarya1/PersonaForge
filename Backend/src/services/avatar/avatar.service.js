import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import env from '../../config/env.js';
import { storageConfig } from '../../config/storage.js';
import { createFileName, ensureDir, toPublicUrl } from '../../utils/file.js';
import { getMediaDuration, runFfmpeg } from '../../utils/media.js';
import {
  createDIDTalk,
  generateAvatarWithDID,
  getDIDTalk
} from './providers/did.provider.js';

const createFallbackAvatarVideo = async (outputPath, audioPath) => {
  const duration = await getMediaDuration(audioPath);
  await runFfmpeg([
    '-f',
    'lavfi',
    '-i',
    `color=c=black:s=1280x720:d=${duration}`,
    '-i',
    audioPath,
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c:v',
    'libx264',
    '-c:a',
    'aac',
    '-shortest',
    '-pix_fmt',
    'yuv420p',
    outputPath
  ]);
};

export const generateAvatar = async ({ audioPath, script, avatarId }) => {
  await ensureDir(storageConfig.avatarDir);
  const outputPath = path.join(storageConfig.avatarDir, createFileName('avatar', 'mp4'));
  const audioUrl = toPublicUrl(env.baseUrl, audioPath, storageConfig.tempRoot);
  const remoteVideoUrl = await generateAvatarWithDID({ audioUrl, script, avatarId });

  if (!remoteVideoUrl) {
    await createFallbackAvatarVideo(outputPath, audioPath);
    return outputPath;
  }

  const response = await axios.get(remoteVideoUrl, { responseType: 'arraybuffer' });
  await fs.writeFile(outputPath, response.data);
  return outputPath;
};

export const startAvatarGeneration = async ({ audioPath, avatarId, projectId, jobId }) => {
  await ensureDir(storageConfig.avatarDir);

  if (!env.didApiKey && env.allowMockProviders) {
    const outputPath = path.join(storageConfig.avatarDir, createFileName('avatar-mock', 'mp4'));
    await createFallbackAvatarVideo(outputPath, audioPath);
    return { status: 'done', avatarVideoPath: outputPath, provider: 'mock' };
  }

  const audioUrl = toPublicUrl(env.baseUrl, audioPath, storageConfig.tempRoot);
  const talk = await createDIDTalk({
    audioUrl,
    avatarId,
    webhookUrl: `${env.baseUrl}/api/webhooks/did`,
    userData: { projectId, jobId }
  });

  return {
    status: 'awaiting_result',
    provider: 'did',
    providerJobId: talk.id
  };
};

export const completeAvatarGeneration = async (talkId) => {
  const talk = await getDIDTalk(talkId);

  if (talk.status !== 'done' || !talk.result_url) {
    throw new Error(`D-ID Talk ${talkId} is not complete (status: ${talk.status}).`);
  }

  await ensureDir(storageConfig.avatarDir);
  const outputPath = path.join(storageConfig.avatarDir, createFileName('avatar', 'mp4'));
  const response = await axios.get(talk.result_url, { responseType: 'arraybuffer' });
  await fs.writeFile(outputPath, response.data);

  return { avatarVideoPath: outputPath, talk };
};
