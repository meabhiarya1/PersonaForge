import dotenv from 'dotenv';

dotenv.config();

const toBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const env = {
  port: process.env.PORT || 6001,
  dbHost: process.env.DB_HOST || '127.0.0.1',
  dbPort: Number(process.env.DB_PORT || 3306),
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'persona_forge',
  redisHost: process.env.REDIS_HOST || '127.0.0.1',
  redisPort: Number(process.env.REDIS_PORT || 6379),
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  embeddingDimensions: Number(process.env.EMBEDDING_DIMENSIONS || 512),
  referenceChunkWords: Number(process.env.REFERENCE_CHUNK_WORDS || 180),
  referenceChunkOverlapWords: Number(process.env.REFERENCE_CHUNK_OVERLAP_WORDS || 30),
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || '',
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',
  didApiKey: process.env.DID_API_KEY || '',
  didPollIntervalMs: Number(process.env.DID_POLL_INTERVAL_MS || 5000),
  didTimeoutMs: Number(process.env.DID_TIMEOUT_MS || 600000),
  didFallbackIntervalMs: Number(process.env.DID_FALLBACK_INTERVAL_MS || 60000),
  baseUrl: process.env.BASE_URL || 'http://localhost:6001',
  allowMockProviders: toBoolean(process.env.ALLOW_MOCK_PROVIDERS, false),
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
  ffprobePath: process.env.FFPROBE_PATH || 'ffprobe'
};

export default env;
