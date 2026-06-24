import fs from 'fs/promises';
import path from 'path';
import { storageConfig } from '../../config/storage.js';
import { createFileName, ensureDir } from '../../utils/file.js';

export const toTimestamp = (seconds) => {
  const date = new Date(seconds * 1000).toISOString().slice(11, 23);
  return date.replace('.', ',');
};

export const buildCaptionContent = (scriptData, duration = 60) => {
  const scenes = scriptData.scenes.length
    ? scriptData.scenes
    : [{ sceneNumber: 1, caption: scriptData.script }];
  const segmentLength = duration / scenes.length;

  return scenes
    .map((scene, index) => {
      const start = index * segmentLength;
      const end = index === scenes.length - 1 ? duration : (index + 1) * segmentLength;
      return [
        String(index + 1),
        `${toTimestamp(start)} --> ${toTimestamp(end)}`,
        scene.caption || scene.text || '',
        ''
      ].join('\n');
    })
    .join('\n');
};

export const generateCaptions = async (scriptData, duration = 60) => {
  await ensureDir(storageConfig.captionDir);
  const outputPath = path.join(storageConfig.captionDir, createFileName('captions', 'srt'));
  const content = buildCaptionContent(scriptData, duration);

  await fs.writeFile(outputPath, content, 'utf8');
  return outputPath;
};
