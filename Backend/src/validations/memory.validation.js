import { z } from 'zod';
import AppError from '../utils/AppError.js';

const parse = (schema, input) => {
  const result = schema.safeParse(input);
  if (!result.success) throw new AppError(result.error.issues[0]?.message || 'Invalid memory input.', 400);
  return result.data;
};

const createSchema = z.object({
  title: z.string().trim().min(1).max(255),
  content: z.string().trim().min(20).max(100000),
  sourceType: z.enum(['text', 'pdf', 'image', 'screenshot']).default('text')
});

const searchSchema = z.object({
  searchText: z.string().trim().min(2).max(2000),
  limit: z.coerce.number().int().min(1).max(20).default(5),
  documentId: z.string().uuid().nullable().optional()
});

export const validateCreateMemoryInput = (input) => parse(createSchema, input);
export const validateSearchMemoryInput = (input) => parse(searchSchema, input);
