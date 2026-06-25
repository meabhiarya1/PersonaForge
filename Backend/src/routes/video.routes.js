import { Router } from 'express';
import {
  generateVideo,
  getVideoProject,
  listVideos
} from '../controllers/video.controller.js';

const router = Router();

router.post('/generate', generateVideo);
router.get('/', listVideos);
router.get('/:projectId', getVideoProject);

export default router;
