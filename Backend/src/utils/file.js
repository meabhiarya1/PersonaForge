import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';

export const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

export const createFileName = (prefix, extension) => {
  return `${prefix}-${Date.now()}-${nanoid(8)}.${extension}`;
};

export const toPublicUrl = (baseUrl, absolutePath, tempRoot) => {
  const relativePath = path.relative(tempRoot, absolutePath).split(path.sep).join('/');
  return `${baseUrl}/temp/${relativePath}`;
};
