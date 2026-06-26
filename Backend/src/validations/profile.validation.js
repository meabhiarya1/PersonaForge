import { z } from 'zod';
import AppError from '../utils/AppError.js';

const profileFields = {
  name: z.string().min(2).max(120),
  language: z.string().max(50),
  targetAudience: z.string().max(255),
  style: z.string().max(100),
  duration: z.coerce.number().int().min(15).max(600),
  avatarId: z.string().max(255),
  voiceId: z.string().max(255),
  toneNotes: z.string().max(2000),
  commonPhrases: z.string().max(2000),
  teachingStyle: z.string().max(2000),
  hookStyle: z.string().max(2000)
};

const profileSchema = z.object({
  name: profileFields.name,
  language: profileFields.language.optional().default('English'),
  targetAudience: profileFields.targetAudience.optional().default('general audience'),
  style: profileFields.style.optional().default('educational'),
  duration: profileFields.duration.optional().default(60),
  avatarId: profileFields.avatarId.optional().default('default-avatar'),
  voiceId: profileFields.voiceId.optional().default(''),
  toneNotes: profileFields.toneNotes.optional().default(''),
  commonPhrases: profileFields.commonPhrases.optional().default(''),
  teachingStyle: profileFields.teachingStyle.optional().default(''),
  hookStyle: profileFields.hookStyle.optional().default('')
});

const profilePatchSchema = z.object(profileFields).partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: 'At least one profile field is required.'
  }
);

const parsePayload = (schema, payload) => {
  const result = schema.safeParse(payload);

  if (!result.success) {
    const message = result.error.errors.map((error) => error.message).join(', ');
    throw new AppError(message, 400);
  }

  return result.data;
};

export const validateCreateProfileInput = (payload) => parsePayload(profileSchema, payload);

export const validateUpdateProfileInput = (payload) => parsePayload(profilePatchSchema, payload);
