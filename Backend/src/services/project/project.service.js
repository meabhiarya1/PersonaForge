import { randomUUID } from 'crypto';
import { pool, query } from '../../config/db.js';
import {
  VIDEO_PROJECT_COLUMNS,
  VIDEO_PROJECT_TABLE
} from '../../models/VideoProject.model.js';
import {
  VIDEO_JOB_COLUMNS,
  VIDEO_JOB_TABLE
} from '../../models/VideoJob.model.js';
import AppError from '../../utils/AppError.js';
import { JOB_STATUS } from '../../constants/jobStatus.js';
import { safeJsonParse, safeJsonStringify } from '../../utils/json.js';

const projectColumnMap = {
  topic: VIDEO_PROJECT_COLUMNS.TOPIC,
  notes: VIDEO_PROJECT_COLUMNS.NOTES,
  language: VIDEO_PROJECT_COLUMNS.LANGUAGE,
  duration: VIDEO_PROJECT_COLUMNS.DURATION,
  targetAudience: VIDEO_PROJECT_COLUMNS.TARGET_AUDIENCE,
  style: VIDEO_PROJECT_COLUMNS.STYLE,
  avatarId: VIDEO_PROJECT_COLUMNS.AVATAR_ID,
  inputType: VIDEO_PROJECT_COLUMNS.INPUT_TYPE,
  referenceText: VIDEO_PROJECT_COLUMNS.REFERENCE_TEXT,
  analysisData: VIDEO_PROJECT_COLUMNS.ANALYSIS_DATA,
  scriptData: VIDEO_PROJECT_COLUMNS.SCRIPT_DATA,
  audioUrl: VIDEO_PROJECT_COLUMNS.AUDIO_URL,
  avatarVideoUrl: VIDEO_PROJECT_COLUMNS.AVATAR_VIDEO_URL,
  captionUrl: VIDEO_PROJECT_COLUMNS.CAPTION_URL,
  finalVideoUrl: VIDEO_PROJECT_COLUMNS.FINAL_VIDEO_URL,
  status: VIDEO_PROJECT_COLUMNS.STATUS,
  errorMessage: VIDEO_PROJECT_COLUMNS.ERROR_MESSAGE
};

const jobColumnMap = {
  projectId: VIDEO_JOB_COLUMNS.PROJECT_ID,
  queueJobId: VIDEO_JOB_COLUMNS.QUEUE_JOB_ID,
  status: VIDEO_JOB_COLUMNS.STATUS,
  currentStep: VIDEO_JOB_COLUMNS.CURRENT_STEP,
  errorMessage: VIDEO_JOB_COLUMNS.ERROR_MESSAGE
};

const mapProjectRow = (row) => {
  if (!row) return null;

  return {
    id: row[VIDEO_PROJECT_COLUMNS.ID],
    topic: row[VIDEO_PROJECT_COLUMNS.TOPIC],
    notes: row[VIDEO_PROJECT_COLUMNS.NOTES],
    language: row[VIDEO_PROJECT_COLUMNS.LANGUAGE],
    duration: row[VIDEO_PROJECT_COLUMNS.DURATION],
    targetAudience: row[VIDEO_PROJECT_COLUMNS.TARGET_AUDIENCE],
    style: row[VIDEO_PROJECT_COLUMNS.STYLE],
    avatarId: row[VIDEO_PROJECT_COLUMNS.AVATAR_ID],
    inputType: row[VIDEO_PROJECT_COLUMNS.INPUT_TYPE],
    referenceText: row[VIDEO_PROJECT_COLUMNS.REFERENCE_TEXT],
    analysisData: safeJsonParse(row[VIDEO_PROJECT_COLUMNS.ANALYSIS_DATA]),
    scriptData: safeJsonParse(row[VIDEO_PROJECT_COLUMNS.SCRIPT_DATA]),
    audioUrl: row[VIDEO_PROJECT_COLUMNS.AUDIO_URL],
    avatarVideoUrl: row[VIDEO_PROJECT_COLUMNS.AVATAR_VIDEO_URL],
    captionUrl: row[VIDEO_PROJECT_COLUMNS.CAPTION_URL],
    finalVideoUrl: row[VIDEO_PROJECT_COLUMNS.FINAL_VIDEO_URL],
    status: row[VIDEO_PROJECT_COLUMNS.STATUS],
    errorMessage: row[VIDEO_PROJECT_COLUMNS.ERROR_MESSAGE],
    createdAt: row[VIDEO_PROJECT_COLUMNS.CREATED_AT],
    updatedAt: row[VIDEO_PROJECT_COLUMNS.UPDATED_AT]
  };
};

const mapJobRow = (row) => {
  if (!row) return null;

  return {
    id: row[VIDEO_JOB_COLUMNS.ID],
    projectId: row[VIDEO_JOB_COLUMNS.PROJECT_ID],
    queueJobId: row[VIDEO_JOB_COLUMNS.QUEUE_JOB_ID],
    status: row[VIDEO_JOB_COLUMNS.STATUS],
    currentStep: row[VIDEO_JOB_COLUMNS.CURRENT_STEP],
    errorMessage: row[VIDEO_JOB_COLUMNS.ERROR_MESSAGE],
    createdAt: row[VIDEO_JOB_COLUMNS.CREATED_AT],
    updatedAt: row[VIDEO_JOB_COLUMNS.UPDATED_AT]
  };
};

const normalizeProjectValue = (key, value) => {
  if (key === 'scriptData' || key === 'analysisData') {
    return safeJsonStringify(value);
  }

  return value ?? null;
};

const normalizeJobValue = (key, value) => value ?? null;

const buildUpdate = (data, columnMap, normalizeValue) => {
  const entries = Object.entries(data).filter(([key]) => Object.hasOwn(columnMap, key));
  const assignments = [];
  const params = {};

  entries.forEach(([key, value], index) => {
    const paramName = `value${index}`;
    assignments.push(`${columnMap[key]} = :${paramName}`);
    params[paramName] = normalizeValue(key, value);
  });

  return { assignments, params };
};

export const createVideoProject = async (input) => {
  const projectId = randomUUID();

  await query(
    `INSERT INTO ${VIDEO_PROJECT_TABLE}
      (
        ${VIDEO_PROJECT_COLUMNS.ID},
        ${VIDEO_PROJECT_COLUMNS.TOPIC},
        ${VIDEO_PROJECT_COLUMNS.NOTES},
        ${VIDEO_PROJECT_COLUMNS.LANGUAGE},
        ${VIDEO_PROJECT_COLUMNS.DURATION},
        ${VIDEO_PROJECT_COLUMNS.TARGET_AUDIENCE},
        ${VIDEO_PROJECT_COLUMNS.STYLE},
        ${VIDEO_PROJECT_COLUMNS.AVATAR_ID},
        ${VIDEO_PROJECT_COLUMNS.INPUT_TYPE},
        ${VIDEO_PROJECT_COLUMNS.REFERENCE_TEXT},
        ${VIDEO_PROJECT_COLUMNS.STATUS}
      )
     VALUES
      (
        :id,
        :topic,
        :notes,
        :language,
        :duration,
        :targetAudience,
        :style,
        :avatarId,
        :inputType,
        :referenceText,
        :status
      )`,
    {
      id: projectId,
      topic: input.topic,
      notes: input.notes || null,
      language: input.language || 'English',
      duration: input.duration || 60,
      targetAudience: input.targetAudience || null,
      style: input.style || null,
      avatarId: input.avatarId || null,
      inputType: input.inputType || 'simple_prompt',
      referenceText: input.referenceText || null,
      status: JOB_STATUS.QUEUED
    }
  );

  return getVideoProjectById(projectId);
};

export const createVideoJob = async ({ projectId, queueJobId }) => {
  const jobId = randomUUID();

  await query(
    `INSERT INTO ${VIDEO_JOB_TABLE}
      (
        ${VIDEO_JOB_COLUMNS.ID},
        ${VIDEO_JOB_COLUMNS.PROJECT_ID},
        ${VIDEO_JOB_COLUMNS.QUEUE_JOB_ID},
        ${VIDEO_JOB_COLUMNS.STATUS},
        ${VIDEO_JOB_COLUMNS.CURRENT_STEP}
      )
     VALUES
      (
        :id,
        :projectId,
        :queueJobId,
        :status,
        :currentStep
      )`,
    {
      id: jobId,
      projectId,
      queueJobId: queueJobId || null,
      status: JOB_STATUS.QUEUED,
      currentStep: JOB_STATUS.QUEUED
    }
  );

  return getVideoJobById(jobId);
};

export const getVideoProjectById = async (projectId) => {
  const rows = await query(
    `SELECT * FROM ${VIDEO_PROJECT_TABLE}
     WHERE ${VIDEO_PROJECT_COLUMNS.ID} = :projectId
     LIMIT 1`,
    { projectId }
  );
  const project = mapProjectRow(rows[0]);

  if (!project) {
    throw new AppError('Video project not found', 404);
  }

  return project;
};

export const listVideoProjects = async ({ status, limit = 24 } = {}) => {
  const normalizedLimit = Math.min(Math.max(Number(limit) || 24, 1), 100);
  const filters = [];
  const params = {};

  if (status) {
    filters.push(`${VIDEO_PROJECT_COLUMNS.STATUS} = :status`);
    params.status = status;
  }

  const rows = await query(
    `SELECT * FROM ${VIDEO_PROJECT_TABLE}
     ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
     ORDER BY ${VIDEO_PROJECT_COLUMNS.CREATED_AT} DESC
     LIMIT ${normalizedLimit}`,
    params
  );

  return rows.map(mapProjectRow);
};

export const getVideoJobById = async (jobId) => {
  const rows = await query(
    `SELECT * FROM ${VIDEO_JOB_TABLE}
     WHERE ${VIDEO_JOB_COLUMNS.ID} = :jobId
     LIMIT 1`,
    { jobId }
  );
  const videoJob = mapJobRow(rows[0]);

  if (!videoJob) {
    throw new AppError('Video job not found', 404);
  }

  return videoJob;
};

export const getVideoJobByQueueJobId = async (queueJobId) => {
  const rows = await query(
    `SELECT * FROM ${VIDEO_JOB_TABLE}
     WHERE ${VIDEO_JOB_COLUMNS.QUEUE_JOB_ID} = :queueJobId
     LIMIT 1`,
    { queueJobId }
  );
  const videoJob = mapJobRow(rows[0]);

  if (!videoJob) {
    throw new AppError('Video job not found', 404);
  }

  return videoJob;
};

export const getLatestVideoJobByProjectId = async (projectId) => {
  const rows = await query(
    `SELECT * FROM ${VIDEO_JOB_TABLE}
     WHERE ${VIDEO_JOB_COLUMNS.PROJECT_ID} = :projectId
     ORDER BY ${VIDEO_JOB_COLUMNS.CREATED_AT} DESC
     LIMIT 1`,
    { projectId }
  );
  const videoJob = mapJobRow(rows[0]);

  if (!videoJob) {
    throw new AppError('Video job not found', 404);
  }

  return videoJob;
};

export const updateVideoProject = async (projectId, data) => {
  const { assignments, params } = buildUpdate(data, projectColumnMap, normalizeProjectValue);

  if (!assignments.length) {
    return getVideoProjectById(projectId);
  }

  await query(
    `UPDATE ${VIDEO_PROJECT_TABLE}
     SET ${assignments.join(', ')}
     WHERE ${VIDEO_PROJECT_COLUMNS.ID} = :projectId`,
    { ...params, projectId }
  );

  return getVideoProjectById(projectId);
};

export const updateVideoJob = async (jobId, data) => {
  const { assignments, params } = buildUpdate(data, jobColumnMap, normalizeJobValue);

  if (!assignments.length) {
    return getVideoJobById(jobId);
  }

  await query(
    `UPDATE ${VIDEO_JOB_TABLE}
     SET ${assignments.join(', ')}
     WHERE ${VIDEO_JOB_COLUMNS.ID} = :jobId`,
    { ...params, jobId }
  );

  return getVideoJobById(jobId);
};

export const updateProjectAndJobStatus = async ({
  projectId,
  jobId,
  status,
  currentStep = status,
  projectData = {},
  jobData = {}
}) => {
  const projectUpdate = buildUpdate(
    {
      ...projectData,
      status
    },
    projectColumnMap,
    normalizeProjectValue
  );
  const jobUpdate = buildUpdate(
    {
      ...jobData,
      status,
      currentStep
    },
    jobColumnMap,
    normalizeJobValue
  );

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE ${VIDEO_PROJECT_TABLE}
       SET ${projectUpdate.assignments.join(', ')}
       WHERE ${VIDEO_PROJECT_COLUMNS.ID} = :projectId`,
      { ...projectUpdate.params, projectId }
    );
    await connection.execute(
      `UPDATE ${VIDEO_JOB_TABLE}
       SET ${jobUpdate.assignments.join(', ')}
       WHERE ${VIDEO_JOB_COLUMNS.ID} = :jobId`,
      { ...jobUpdate.params, jobId }
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const [project, videoJob] = await Promise.all([
    getVideoProjectById(projectId),
    getVideoJobById(jobId)
  ]);

  return { project, job: videoJob };
};

export const markProjectFailed = async ({ projectId, jobId, errorMessage }) => {
  return updateProjectAndJobStatus({
    projectId,
    jobId,
    status: JOB_STATUS.FAILED,
    currentStep: JOB_STATUS.FAILED,
    projectData: { errorMessage },
    jobData: { errorMessage }
  });
};
