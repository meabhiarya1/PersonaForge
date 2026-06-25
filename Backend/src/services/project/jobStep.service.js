import { randomUUID } from 'crypto';
import { query } from '../../config/db.js';
import {
  VIDEO_JOB_STEP_COLUMNS,
  VIDEO_JOB_STEP_TABLE
} from '../../models/VideoJobStep.model.js';
import AppError from '../../utils/AppError.js';
import { safeJsonParse, safeJsonStringify } from '../../utils/json.js';

const mapStepRow = (row) => {
  if (!row) return null;

  return {
    id: row[VIDEO_JOB_STEP_COLUMNS.ID],
    jobId: row[VIDEO_JOB_STEP_COLUMNS.JOB_ID],
    step: row[VIDEO_JOB_STEP_COLUMNS.STEP],
    status: row[VIDEO_JOB_STEP_COLUMNS.STATUS],
    provider: row[VIDEO_JOB_STEP_COLUMNS.PROVIDER],
    providerJobId: row[VIDEO_JOB_STEP_COLUMNS.PROVIDER_JOB_ID],
    inputData: safeJsonParse(row[VIDEO_JOB_STEP_COLUMNS.INPUT_DATA]),
    outputData: safeJsonParse(row[VIDEO_JOB_STEP_COLUMNS.OUTPUT_DATA]),
    errorMessage: row[VIDEO_JOB_STEP_COLUMNS.ERROR_MESSAGE],
    startedAt: row[VIDEO_JOB_STEP_COLUMNS.STARTED_AT],
    completedAt: row[VIDEO_JOB_STEP_COLUMNS.COMPLETED_AT],
    createdAt: row[VIDEO_JOB_STEP_COLUMNS.CREATED_AT],
    updatedAt: row[VIDEO_JOB_STEP_COLUMNS.UPDATED_AT]
  };
};

export const upsertJobStep = async ({
  jobId,
  step,
  status,
  provider = null,
  providerJobId = null,
  inputData = null,
  outputData = null,
  errorMessage = null,
  startedAt = null,
  completedAt = null
}) => {
  await query(
    `INSERT INTO ${VIDEO_JOB_STEP_TABLE} (
      id, job_id, step, status, provider, provider_job_id,
      input_data, output_data, error_message, started_at, completed_at
    ) VALUES (
      :id, :jobId, :step, :status, :provider, :providerJobId,
      :inputData, :outputData, :errorMessage, :startedAt, :completedAt
    )
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      provider = COALESCE(VALUES(provider), provider),
      provider_job_id = COALESCE(VALUES(provider_job_id), provider_job_id),
      input_data = COALESCE(VALUES(input_data), input_data),
      output_data = COALESCE(VALUES(output_data), output_data),
      error_message = VALUES(error_message),
      started_at = COALESCE(VALUES(started_at), started_at),
      completed_at = COALESCE(VALUES(completed_at), completed_at)`,
    {
      id: randomUUID(),
      jobId,
      step,
      status,
      provider,
      providerJobId,
      inputData: safeJsonStringify(inputData),
      outputData: safeJsonStringify(outputData),
      errorMessage,
      startedAt,
      completedAt
    }
  );

  return getJobStep(jobId, step);
};

export const getJobStep = async (jobId, step) => {
  const rows = await query(
    `SELECT * FROM ${VIDEO_JOB_STEP_TABLE}
     WHERE job_id = :jobId AND step = :step
     LIMIT 1`,
    { jobId, step }
  );

  return mapStepRow(rows[0]);
};

export const getJobStepByProviderJobId = async (provider, providerJobId) => {
  const rows = await query(
    `SELECT * FROM ${VIDEO_JOB_STEP_TABLE}
     WHERE provider = :provider AND provider_job_id = :providerJobId
     LIMIT 1`,
    { provider, providerJobId }
  );
  const step = mapStepRow(rows[0]);

  if (!step) throw new AppError('Provider job step not found', 404);
  return step;
};
