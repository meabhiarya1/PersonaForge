import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import ffmpeg from '../../config/ffmpeg.js';
import env from '../../config/env.js';
import { storageConfig } from '../../config/storage.js';
import { createFileName, ensureDir, toPublicUrl } from '../../utils/file.js';
import { generateAvatarWithDID } from './providers/did.provider.js';

const createFallbackAvatarVideo = async (outputPath) => {
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input('color=c=black:s=1280x720:d=5')
      .inputFormat('lavfi')
      .outputOptions([
        '-vf',
        "drawtext=text='Avatar video placeholder':fontcolor=white:fontsize=42:x=(w-text_w)/2:y=(h-text_h)/2",
        '-pix_fmt',
        'yuv420p'
      ])
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject);
  });
};

export const generateAvatar = async ({ audioPath, script, avatarId }) => {
  await ensureDir(storageConfig.avatarDir);
  const outputPath = path.join(storageConfig.avatarDir, createFileName('avatar', 'mp4'));
  const audioUrl = toPublicUrl(env.baseUrl, audioPath, storageConfig.tempRoot);
  const remoteVideoUrl = await generateAvatarWithDID({ audioUrl, script, avatarId });

  if (!remoteVideoUrl) {
    await createFallbackAvatarVideo(outputPath);
    return outputPath;
  }

  const response = await axios.get(remoteVideoUrl, { responseType: 'arraybuffer' });
  await fs.writeFile(outputPath, response.data);
  return outputPath;
};
