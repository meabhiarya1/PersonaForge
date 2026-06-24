import ffmpeg from '../config/ffmpeg.js';
import env from '../config/env.js';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const runFfmpeg = async (args) => {
  await execFileAsync(env.ffmpegPath, ['-y', ...args]);
};

export const assertFfmpegFilter = async (filterName) => {
  const { stdout, stderr } = await execFileAsync(env.ffmpegPath, ['-hide_banner', '-filters']);
  const filterList = `${stdout}\n${stderr}`;

  if (!new RegExp(`\\b${filterName}\\b`).test(filterList)) {
    throw new Error(
      `FFmpeg filter "${filterName}" is unavailable. Install an FFmpeg build with libass support.`
    );
  }
};

export const getMediaDuration = async (filePath) => {
  const metadata = await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (error, value) => {
      if (error) reject(error);
      else resolve(value);
    });
  });

  const duration = Number(metadata?.format?.duration);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Unable to determine media duration for ${filePath}`);
  }

  return duration;
};
