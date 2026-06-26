import env from '../../config/env.js';
import { storageConfig } from '../../config/storage.js';
import { toPublicUrl } from '../../utils/file.js';
import path from 'path';

export const getPublicUrl = (absolutePath) => {
  return toPublicUrl(env.baseUrl, absolutePath, storageConfig.tempRoot);
};

export const getLocalPathFromPublicUrl = (publicUrl) => {
  const pathname = decodeURIComponent(new URL(publicUrl).pathname);
  const relativePath = pathname.replace(/^\/temp\//, '');
  const localPath = path.resolve(storageConfig.tempRoot, relativePath);

  if (!localPath.startsWith(`${storageConfig.tempRoot}${path.sep}`)) {
    throw new Error('Media URL is outside the configured temp storage.');
  }

  return localPath;
};
