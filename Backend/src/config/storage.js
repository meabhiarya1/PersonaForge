import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const storageConfig = {
  tempRoot: path.resolve(__dirname, '../temp'),
  audioDir: path.resolve(__dirname, '../temp/audio'),
  avatarDir: path.resolve(__dirname, '../temp/avatar'),
  captionDir: path.resolve(__dirname, '../temp/captions'),
  finalDir: path.resolve(__dirname, '../temp/final')
};
