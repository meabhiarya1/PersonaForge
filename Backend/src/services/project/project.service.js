import { nanoid } from 'nanoid';
import { db } from '../../config/db.js';
import { VIDEO_PROJECT_TABLE } from '../../models/VideoProject.model.js';
import { VIDEO_JOB_TABLE } from '../../models/VideoJob.model.js';
import AppError from '../../utils/AppError.js';
import { JOB_STATUS } from '../../constants/jobStatus.js';
import { VIDEO_STATUS } from '../../constants/videoStatus.js';

const parseJson = (value) => {
  if (!value) return null;
  return typeof value === 'string' ? JSON.parse(value) : value;
};

const mapProject = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    topic: row.topic,
    notes: row.notes,
    language: row.language,
    duration: row.duration,
    targetAudience: row.target_audience,
    style: row.style,
    avatarId: row.avatar_id,
    scriptData: parseJson(row.script_data),
    audioUrl: row.audio_url,
    avatarVideoUrl: row.avatar_video_url,
    captionUrl: row.caption_url,
    finalVideoUrl: row.final_video_url,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const mapVideoJob = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    projectId: row.project_id,
    queueJobId: row.queue_job_id,
    status: row.status,
    currentStep: row.current_step,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const toProjectUpdateColumns = (updates) => {
  const allowed = {
    scriptData: ['script_data', JSON.stringify],
    audioUrl: ['audio_url'],
    avatarVideoUrl: ['avatar_video_url'],
    captionUrl: ['caption_url'],
    finalVideoUrl: ['final_video_url'],
    errorMessage: ['error_message']
  };

  return Object.entries(updates)
    .filter(([key]) => Object.hasOwn(allowed, key))
    .map(([key, value]) => {
      const [column, transform = (item) => item] = allowed[key];
      return [column, transform(value)];
    });
};

export const createProject = async (input) => {
  const projectId = nanoid(16);

  await db.execute(
    `INSERT INTO ${VIDEO_PROJECT_TABLE}
      (id, topic, notes, language, duration, target_audience, style, avatar_id, status)
     VALUES
      (:id, :topic, :notes, :language, :duration, :targetAudience, :style, :avatarId, :status)`,
    {
      id: projectId,
      topic: input.topic,
      notes: input.notes || null,
      language: input.language,
      duration: input.duration,
      targetAudience: input.targetAudience,
      style: input.style,
      avatarId: input.avatarId,
      status: VIDEO_STATUS.QUEUED
    }
  );

  return getProjectById(projectId);
};

export const createVideoJob = async ({ projectId, queueJobId }) => {
  await db.execute(
    `INSERT INTO ${VIDEO_JOB_TABLE}
      (project_id, queue_job_id, status, current_step)
     VALUES
      (:projectId, :queueJobId, :status, :currentStep)`,
    {
      projectId,
      queueJobId,
      status: JOB_STATUS.QUEUED,
      currentStep: JOB_STATUS.QUEUED
    }
  );

  return getVideoJobById(queueJobId);
};

export const getProjectById = async (projectId) => {
  const [rows] = await db.execute(
    `SELECT * FROM ${VIDEO_PROJECT_TABLE} WHERE id = :projectId LIMIT 1`,
    { projectId }
  );
  const project = mapProject(rows[0]);

  if (!project) {
    throw new AppError('Video project not found', 404);
  }

  return project;
};

export const getVideoJobById = async (jobId) => {
  const [rows] = await db.execute(
    `SELECT * FROM ${VIDEO_JOB_TABLE} WHERE queue_job_id = :jobId LIMIT 1`,
    { jobId }
  );
  const videoJob = mapVideoJob(rows[0]);

  if (!videoJob) {
    throw new AppError('Video job not found', 404);
  }

  return videoJob;
};

export const updateProjectStatus = async (projectId, status, updates = {}) => {
  const updateColumns = toProjectUpdateColumns(updates);
  const assignments = ['status = :status'];
  const params = { projectId, status };

  updateColumns.forEach(([column, value], index) => {
    const paramName = `value${index}`;
    assignments.push(`${column} = :${paramName}`);
    params[paramName] = value;
  });

  await db.execute(
    `UPDATE ${VIDEO_PROJECT_TABLE}
     SET ${assignments.join(', ')}
     WHERE id = :projectId`,
    params
  );

  return getProjectById(projectId);
};

export const updateJobStatus = async (queueJobId, status, updates = {}) => {
  await db.execute(
    `UPDATE ${VIDEO_JOB_TABLE}
     SET status = :status,
         current_step = :currentStep,
         error_message = :errorMessage
     WHERE queue_job_id = :queueJobId`,
    {
      queueJobId,
      status,
      currentStep: updates.currentStep || status,
      errorMessage: updates.errorMessage || null
    }
  );

  return getVideoJobById(queueJobId);
};
