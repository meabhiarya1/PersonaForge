import ffmpeg from 'fluent-ffmpeg';
import env from './env.js';

ffmpeg.setFfmpegPath(env.ffmpegPath);
ffmpeg.setFfprobePath(env.ffprobePath);

export default ffmpeg;
