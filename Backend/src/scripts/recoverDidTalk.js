import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { connectDB, pool } from '../config/db.js';
import { storageConfig } from '../config/storage.js';
import { JOB_STATUS } from '../constants/jobStatus.js';
import { getDIDTalk } from '../services/avatar/providers/did.provider.js';
import { generateCaptions } from '../services/caption/caption.service.js';
import {
  getLatestVideoJobByProjectId,
  getVideoProjectById,
  updateProjectAndJobStatus
} from '../services/project/project.service.js';
import { createFinalOutputPath, renderFinalVideo } from '../services/render/render.service.js';
import { getPublicUrl } from '../services/storage/storage.service.js';
import { createFileName, ensureDir } from '../utils/file.js';
import { getMediaDuration } from '../utils/media.js';

const [projectId, talkId] = process.argv.slice(2);

if (!projectId || !talkId) {
  throw new Error('Usage: npm run recover:did -- <projectId> <talkId>');
}

const getLocalTempPath = (publicUrl) => {
  const pathname = decodeURIComponent(new URL(publicUrl).pathname);
  const relativePath = pathname.replace(/^\/temp\//, '');
  const localPath = path.resolve(storageConfig.tempRoot, relativePath);

  if (!localPath.startsWith(`${storageConfig.tempRoot}${path.sep}`)) {
    throw new Error('Project audio URL is outside the configured temp storage.');
  }

  return localPath;
};

await connectDB();

try {
  const [project, videoJob, talk] = await Promise.all([
    getVideoProjectById(projectId),
    getLatestVideoJobByProjectId(projectId),
    getDIDTalk(talkId)
  ]);

  if (talk.status !== 'done' || !talk.result_url) {
    throw new Error(`D-ID Talk ${talkId} is not ready (status: ${talk.status}).`);
  }

  const audioPath = getLocalTempPath(project.audioUrl);
  await ensureDir(storageConfig.avatarDir);
  const avatarVideoPath = path.join(
    storageConfig.avatarDir,
    createFileName('avatar-recovered', 'mp4')
  );
  const response = await axios.get(talk.result_url, { responseType: 'arraybuffer' });
  await fs.writeFile(avatarVideoPath, response.data);

  await updateProjectAndJobStatus({
    projectId,
    jobId: videoJob.id,
    status: JOB_STATUS.AVATAR_GENERATED,
    projectData: { avatarVideoUrl: getPublicUrl(avatarVideoPath), errorMessage: null },
    jobData: { errorMessage: null }
  });

  const audioDuration = await getMediaDuration(audioPath);
  const captionPath = await generateCaptions(project.scriptData, audioDuration);
  await updateProjectAndJobStatus({
    projectId,
    jobId: videoJob.id,
    status: JOB_STATUS.CAPTION_GENERATED,
    projectData: { captionUrl: getPublicUrl(captionPath) }
  });

  await updateProjectAndJobStatus({
    projectId,
    jobId: videoJob.id,
    status: JOB_STATUS.RENDERING
  });
  const outputPath = await createFinalOutputPath();
  const finalVideoPath = await renderFinalVideo({ avatarVideoPath, captionPath, outputPath });
  const finalVideoUrl = getPublicUrl(finalVideoPath);

  await updateProjectAndJobStatus({
    projectId,
    jobId: videoJob.id,
    status: JOB_STATUS.COMPLETED,
    projectData: { finalVideoUrl, errorMessage: null },
    jobData: { errorMessage: null }
  });

  console.log(JSON.stringify({ projectId, jobId: videoJob.id, talkId, finalVideoUrl }, null, 2));
} finally {
  await pool.end();
}
