import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  createCreatorProfile,
  deleteCreatorProfile,
  getCreatorProfileById,
  listCreatorProfiles,
  updateCreatorProfile
} from '../services/profile/profile.service.js';
import {
  validateCreateProfileInput,
  validateUpdateProfileInput
} from '../validations/profile.validation.js';

export const createProfile = asyncHandler(async (req, res) => {
  const input = validateCreateProfileInput(req.body);
  const profile = await createCreatorProfile(input);
  sendSuccess(res, 'Creator profile created', profile, 201);
});

export const listProfiles = asyncHandler(async (req, res) => {
  const profiles = await listCreatorProfiles();
  sendSuccess(res, 'Creator profiles fetched', profiles);
});

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await getCreatorProfileById(req.params.profileId);
  sendSuccess(res, 'Creator profile fetched', profile);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const input = validateUpdateProfileInput(req.body);
  const profile = await updateCreatorProfile(req.params.profileId, input);
  sendSuccess(res, 'Creator profile updated', profile);
});

export const deleteProfile = asyncHandler(async (req, res) => {
  const deleted = await deleteCreatorProfile(req.params.profileId);
  sendSuccess(res, 'Creator profile deleted', deleted);
});
