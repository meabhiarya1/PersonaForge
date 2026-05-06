import { Router } from 'express';
import {
  generateVideo,
  getVideoProject
} from '../controllers/video.controller.js';

const router = Router();

router.post('/generate', generateVideo);
router.get('/:projectId', getVideoProject);

export default router;
