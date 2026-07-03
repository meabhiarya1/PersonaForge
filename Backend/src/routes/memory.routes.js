import { Router } from 'express';
import { createMemory, deleteMemory, listMemories, searchMemories } from '../controllers/memory.controller.js';

const router = Router();
router.post('/documents', createMemory);
router.get('/documents', listMemories);
router.delete('/documents/:documentId', deleteMemory);
router.post('/search', searchMemories);

export default router;
