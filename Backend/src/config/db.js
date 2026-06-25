import mysql from 'mysql2/promise';
import env from './env.js';
import logger from './logger.js';
import { CREATE_VIDEO_PROJECT_TABLE_SQL } from '../models/VideoProject.model.js';
import { CREATE_VIDEO_JOB_TABLE_SQL } from '../models/VideoJob.model.js';
import { CREATE_VIDEO_JOB_STEP_TABLE_SQL } from '../models/VideoJobStep.model.js';
import { JOB_STATUS } from '../constants/jobStatus.js';

export const pool = mysql.createPool({
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

export const query = async (sql, params = {}) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const migrateLegacySchema = async () => {
  const [projectIdColumns] = await pool.query(
    `SELECT CHARACTER_MAXIMUM_LENGTH AS maxLength
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'video_projects' AND COLUMN_NAME = 'id'`,
    [env.dbName]
  );
  const [jobIdColumns] = await pool.query(
    `SELECT DATA_TYPE AS dataType, CHARACTER_MAXIMUM_LENGTH AS maxLength
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'video_jobs' AND COLUMN_NAME = 'id'`,
    [env.dbName]
  );

  const legacyProjectId = Number(projectIdColumns[0]?.maxLength || 0) < 36;
  const legacyJobId =
    jobIdColumns[0]?.dataType !== 'char' || Number(jobIdColumns[0]?.maxLength || 0) < 36;

  if (!legacyProjectId && !legacyJobId) return;

  const [foreignKeys] = await pool.query(
    `SELECT CONSTRAINT_NAME AS constraintName
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'video_jobs'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
    [env.dbName]
  );

  for (const { constraintName } of foreignKeys) {
    const safeConstraintName = String(constraintName).replaceAll('`', '``');
    await pool.query(`ALTER TABLE video_jobs DROP FOREIGN KEY \`${safeConstraintName}\``);
  }

  const statusValues = Object.values(JOB_STATUS).map((status) => `'${status}'`).join(', ');

  if (legacyProjectId) {
    await pool.query(`
      ALTER TABLE video_projects
        MODIFY id CHAR(36) NOT NULL,
        MODIFY language VARCHAR(50) DEFAULT 'English',
        MODIFY duration INT DEFAULT 60,
        MODIFY target_audience VARCHAR(255) NULL,
        MODIFY style VARCHAR(100) NULL,
        MODIFY avatar_id VARCHAR(255) NULL,
        MODIFY status ENUM(${statusValues}) DEFAULT '${JOB_STATUS.QUEUED}'
    `);
  }

  if (legacyJobId) {
    await pool.query(`
      ALTER TABLE video_jobs
        MODIFY id CHAR(36) NOT NULL,
        MODIFY project_id CHAR(36) NOT NULL,
        MODIFY queue_job_id VARCHAR(255) NULL,
        MODIFY status ENUM(${statusValues}) DEFAULT '${JOB_STATUS.QUEUED}',
        MODIFY current_step VARCHAR(100) NULL
    `);
  }

  await pool.query(`
    ALTER TABLE video_jobs
      ADD CONSTRAINT fk_video_jobs_project_id
      FOREIGN KEY (project_id)
      REFERENCES video_projects(id)
      ON DELETE CASCADE
  `);

  logger.info('MYSQL_LEGACY_SCHEMA_MIGRATED', {
    database: env.dbName
  });
};

const syncPhase2Schema = async () => {
  const [statusColumns] = await pool.query(
    `SELECT TABLE_NAME AS tableName, COLUMN_TYPE AS columnType
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME IN ('video_projects', 'video_jobs')
       AND COLUMN_NAME = 'status'`,
    [env.dbName]
  );

  const needsAwaitingAvatar = statusColumns.some(
    ({ columnType }) => !String(columnType).includes(JOB_STATUS.AWAITING_AVATAR)
  );

  if (needsAwaitingAvatar) {
    const statusValues = Object.values(JOB_STATUS).map((status) => `'${status}'`).join(', ');
    await pool.query(`
      ALTER TABLE video_projects
        MODIFY status ENUM(${statusValues}) DEFAULT '${JOB_STATUS.QUEUED}'
    `);
    await pool.query(`
      ALTER TABLE video_jobs
        MODIFY status ENUM(${statusValues}) DEFAULT '${JOB_STATUS.QUEUED}'
    `);
    logger.info('MYSQL_PHASE2_STATUS_SCHEMA_MIGRATED', { database: env.dbName });
  }

  await pool.query(CREATE_VIDEO_JOB_STEP_TABLE_SQL);
};

export const initializeDatabase = async () => {
  const setupConnection = await mysql.createConnection({
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword
  });

  await setupConnection.query(`CREATE DATABASE IF NOT EXISTS \`${env.dbName}\``);
  await setupConnection.end();

  await pool.query(CREATE_VIDEO_PROJECT_TABLE_SQL);
  await pool.query(CREATE_VIDEO_JOB_TABLE_SQL);
  await migrateLegacySchema();
  await syncPhase2Schema();

  logger.info('MYSQL_DATABASE_INITIALIZED', {
    database: env.dbName
  });
};

export const connectDB = initializeDatabase;

export const db = pool;
