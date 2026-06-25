import { Router } from 'express';
import { receiveDIDWebhook } from '../controllers/webhook.controller.js';

const router = Router();

router.post('/did', receiveDIDWebhook);

export default router;
