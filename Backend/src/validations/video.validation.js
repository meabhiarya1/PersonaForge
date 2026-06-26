import { z } from 'zod';
import AppError from '../utils/AppError.js';

const generateVideoSchema = z.object({
  topic: z.string().min(3),
  notes: z.string().optional().default(''),
  inputType: z.enum(['simple_prompt', 'reference_text']).optional().default('simple_prompt'),
  referenceText: z.string().max(20000).optional().default(''),
  language: z.string().optional().default('English'),
  duration: z.coerce.number().int().min(15).max(600).optional().default(60),
  targetAudience: z.string().optional().default('general audience'),
  style: z.string().optional().default('educational'),
  avatarId: z.string().optional().default('default-avatar')
}).superRefine((value, ctx) => {
  if (value.inputType === 'reference_text' && value.referenceText.trim().length < 50) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['referenceText'],
      message: 'Reference text must be at least 50 characters when using reference text mode.'
    });
  }
});

export const validateGenerateVideoInput = (payload) => {
  const result = generateVideoSchema.safeParse(payload);

  if (!result.success) {
    const message = result.error.errors.map((error) => error.message).join(', ');
    throw new AppError(message, 400);
  }

  return result.data;
};
