import env from '../../config/env.js';
import { storageConfig } from '../../config/storage.js';
import { toPublicUrl } from '../../utils/file.js';

export const getPublicUrl = (absolutePath) => {
  return toPublicUrl(env.baseUrl, absolutePath, storageConfig.tempRoot);
};
