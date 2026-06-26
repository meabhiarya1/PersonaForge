import { Router } from 'express';
import {
  createProfile,
  deleteProfile,
  getProfile,
  listProfiles,
  updateProfile
} from '../controllers/profile.controller.js';

const router = Router();

router.post('/', createProfile);
router.get('/', listProfiles);
router.get('/:profileId', getProfile);
router.patch('/:profileId', updateProfile);
router.delete('/:profileId', deleteProfile);

export default router;
