import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  deleteReferenceDocument,
  listReferenceDocuments,
  saveReferenceDocument,
  searchReferenceMemory
} from '../services/memory/referenceMemory.service.js';
import { validateCreateMemoryInput, validateSearchMemoryInput } from '../validations/memory.validation.js';

export const createMemory = asyncHandler(async (req, res) => {
  const document = await saveReferenceDocument(validateCreateMemoryInput(req.body));
  sendSuccess(res, 'Reference document embedded and stored', document, 201);
});

export const listMemories = asyncHandler(async (req, res) => {
  sendSuccess(res, 'Reference documents fetched', await listReferenceDocuments());
});

export const searchMemories = asyncHandler(async (req, res) => {
  sendSuccess(res, 'Similar reference chunks fetched', await searchReferenceMemory(validateSearchMemoryInput(req.body)));
});

export const deleteMemory = asyncHandler(async (req, res) => {
  sendSuccess(res, 'Reference document deleted', await deleteReferenceDocument(req.params.documentId));
});
