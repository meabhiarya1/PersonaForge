import { Router } from 'express';
import {
  checkInputIntent,
  generateVideo,
  getVideoProject,
  listVideos
} from '../controllers/video.controller.js';

const router = Router();

router.post('/generate', generateVideo);
router.post('/intent-check', checkInputIntent);
router.get('/', listVideos);
router.get('/:projectId', getVideoProject);

export default router;
