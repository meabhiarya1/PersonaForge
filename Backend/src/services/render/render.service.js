import path from 'path';
import ffmpeg from '../../config/ffmpeg.js';
import { storageConfig } from '../../config/storage.js';
import { createFileName, ensureDir } from '../../utils/file.js';

const escapeSubtitlePath = (captionPath) => {
  return captionPath.replaceAll('\\', '\\\\').replaceAll(':', '\\:').replaceAll("'", "\\'");
};

export const createFinalOutputPath = async () => {
  await ensureDir(storageConfig.finalDir);
  return path.join(storageConfig.finalDir, createFileName('final', 'mp4'));
};

export const renderFinalVideo = async ({ avatarVideoPath, captionPath, outputPath }) => {
  await ensureDir(path.dirname(outputPath));

  await new Promise((resolve, reject) => {
    ffmpeg(avatarVideoPath)
      .videoFilters(`subtitles='${escapeSubtitlePath(captionPath)}'`)
      .outputOptions(['-c:a copy', '-pix_fmt yuv420p'])
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject);
  });

  return outputPath;
};
