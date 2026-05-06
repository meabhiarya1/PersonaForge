import mysql from 'mysql2/promise';
import env from './env.js';
import logger from './logger.js';

export const db = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true
});

const createVideoProjectsTable = `
  CREATE TABLE IF NOT EXISTS video_projects (
    id VARCHAR(32) PRIMARY KEY,
    topic VARCHAR(255) NOT NULL,
    notes TEXT NULL,
    language VARCHAR(80) DEFAULT 'English',
    duration INT DEFAULT 60,
    target_audience VARCHAR(255) DEFAULT 'general audience',
    style VARCHAR(120) DEFAULT 'educational',
    avatar_id VARCHAR(255) DEFAULT 'default-avatar',
    script_data JSON NULL,
    audio_url TEXT NULL,
    avatar_video_url TEXT NULL,
    caption_url TEXT NULL,
    final_video_url TEXT NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`;

const createVideoJobsTable = `
  CREATE TABLE IF NOT EXISTS video_jobs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(32) NOT NULL,
    queue_job_id VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    current_step VARCHAR(50) NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_video_jobs_project_id (project_id),
    CONSTRAINT fk_video_jobs_project_id
      FOREIGN KEY (project_id)
      REFERENCES video_projects(id)
      ON DELETE CASCADE
  )
`;

export const connectDB = async () => {
  const setupConnection = await mysql.createConnection({
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword
  });

  await setupConnection.query(`CREATE DATABASE IF NOT EXISTS \`${env.dbName}\``);
  await setupConnection.end();

  await db.query(createVideoProjectsTable);
  await db.query(createVideoJobsTable);
  logger.info('MYSQL_CONNECTED');
};
