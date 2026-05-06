import dotenv from 'dotenv';

dotenv.config();

const env = {
  port: process.env.PORT || 5000,
  dbHost: process.env.DB_HOST || '127.0.0.1',
  dbPort: Number(process.env.DB_PORT || 3306),
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'persona_forge',
  redisHost: process.env.REDIS_HOST || '127.0.0.1',
  redisPort: Number(process.env.REDIS_PORT || 6379),
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || '',
  didApiKey: process.env.DID_API_KEY || '',
  baseUrl: process.env.BASE_URL || 'http://localhost:5000'
};

export default env;
