import { z } from 'zod';
import AppError from '../utils/AppError.js';

const generateVideoBaseSchema = z.object({
  topic: z.string().min(3),
  notes: z.string().optional().default(''),
  inputType: z.enum(['simple_prompt', 'reference_text']).optional().default('simple_prompt'),
  referenceText: z.string().max(20000).optional().default(''),
  userIntent: z.string().max(2000).optional().default(''),
  alignmentData: z.record(z.any()).optional().nullable().default(null),
  language: z.string().optional().default('English'),
  duration: z.coerce.number().int().min(15).max(600).optional().default(60),
  targetAudience: z.string().optional().default('general audience'),
  style: z.string().optional().default('educational'),
  avatarId: z.string().optional().default('default-avatar')
});

const generateVideoSchema = generateVideoBaseSchema.superRefine((value, ctx) => {
  if (value.inputType === 'reference_text' && value.referenceText.trim().length < 50) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['referenceText'],
      message: 'Reference text must be at least 50 characters when using reference text mode.'
    });
  }
});

const inputIntentSchema = generateVideoBaseSchema.pick({
  topic: true,
  notes: true,
  inputType: true,
  referenceText: true,
  userIntent: true,
  language: true,
  duration: true,
  targetAudience: true,
  style: true
});

export const validateGenerateVideoInput = (payload) => {
  const result = generateVideoSchema.safeParse(payload);

  if (!result.success) {
    const message = result.error.errors.map((error) => error.message).join(', ');
    throw new AppError(message, 400);
  }

  return result.data;
};

export const validateInputIntentInput = (payload) => {
  const result = inputIntentSchema.safeParse(payload);

  if (!result.success) {
    const message = result.error.errors.map((error) => error.message).join(', ');
    throw new AppError(message, 400);
  }

  return result.data;
};
