import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { handleDIDTalkUpdate } from '../services/webhook/didWebhook.service.js';
import { extractDIDTalkId } from '../utils/didWebhook.js';

export const receiveDIDWebhook = asyncHandler(async (req, res) => {
  const talkId = extractDIDTalkId(req.body);
  if (!talkId) throw new AppError('D-ID webhook is missing the Talk ID', 400);

  const result = await handleDIDTalkUpdate(talkId);
  res.status(result.action === 'pending' ? 202 : 200).json({
    success: true,
    message: 'D-ID webhook processed',
    data: { talkId, action: result.action }
  });
});
