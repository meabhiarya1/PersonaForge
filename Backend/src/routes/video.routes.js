import { Router } from 'express';
import multer from 'multer';
import {
  checkInputIntent,
  extractSource,
  generateVideo,
  getVideoProject,
  listVideos
} from '../controllers/video.controller.js';
import {
  SOURCE_FILE_LIMITS,
  isSupportedSourceMimeType
} from '../services/content/sourceExtraction.service.js';
import AppError from '../utils/AppError.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: SOURCE_FILE_LIMITS.maxFileSizeBytes,
    files: SOURCE_FILE_LIMITS.maxFiles
  },
  fileFilter: (req, file, callback) => {
    if (isSupportedSourceMimeType(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new AppError(`Unsupported source file type: ${file.mimetype}`, 400));
  }
});

router.post('/generate', generateVideo);
router.post('/intent-check', checkInputIntent);
router.post('/extract-source', upload.array('files', SOURCE_FILE_LIMITS.maxFiles), extractSource);
router.get('/', listVideos);
router.get('/:projectId', getVideoProject);

export default router;
