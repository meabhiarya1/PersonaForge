import IORedis from 'ioredis';
import env from './env.js';

export const redisConnection = new IORedis({
  host: env.redisHost,
  port: env.redisPort,
  maxRetriesPerRequest: null
});
