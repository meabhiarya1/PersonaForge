import { execFile } from 'child_process';
import { promisify } from 'util';
import env from '../../config/env.js';
import { query } from '../../config/db.js';
import { redisConnection } from '../../config/redis.js';
import { assertFfmpegFilter } from '../../utils/media.js';

const execFileAsync = promisify(execFile);

const check = async (operation) => {
  try {
    await operation();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export const getReadiness = async () => {
  const [database, redis, ffmpeg] = await Promise.all([
    check(() => query('SELECT 1 AS ok')),
    check(() => redisConnection.ping()),
    check(async () => {
      await execFileAsync(env.ffmpegPath, ['-version']);
      await assertFfmpegFilter('subtitles');
    })
  ]);

  const providers = {
    mode: env.allowMockProviders ? 'mock-allowed' : 'real-only',
    openai: Boolean(env.openaiApiKey),
    elevenLabs: Boolean(env.elevenLabsApiKey),
    did: Boolean(env.didApiKey)
  };
  const providersReady = env.allowMockProviders || Object.values(providers).slice(1).every(Boolean);

  return {
    ready: database.ok && redis.ok && ffmpeg.ok && providersReady,
    dependencies: { database, redis, ffmpeg },
    providers
  };
};
