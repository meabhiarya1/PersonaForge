import mysql from 'mysql2/promise';
import env from './env.js';
import logger from './logger.js';
import { CREATE_VIDEO_PROJECT_TABLE_SQL } from '../models/VideoProject.model.js';
import { CREATE_VIDEO_JOB_TABLE_SQL } from '../models/VideoJob.model.js';

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

  logger.info('MYSQL_DATABASE_INITIALIZED', {
    database: env.dbName
  });
};

export const connectDB = initializeDatabase;

export const db = pool;
