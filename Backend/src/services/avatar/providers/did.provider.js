import axios from 'axios';
import env from '../../../config/env.js';
import logger from '../../../config/logger.js';
import { retry } from '../../../utils/retry.js';

const getAuthorizationHeader = () => {
  const credential = env.didApiKey.trim().replace(/^Basic\s+/i, '');
  const encodedCredential = credential.includes(':')
    ? Buffer.from(credential, 'utf8').toString('base64')
    : credential;

  return `Basic ${encodedCredential}`;
};

const stringifyProviderError = (data) => {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (data.description) return data.description;
  if (data.message) return data.message;
  if (data.error?.description) return data.error.description;
  if (data.error?.message) return data.error.message;
  if (data.error && typeof data.error === 'string') return data.error;
  return JSON.stringify(data);
};

const normalizeDIDError = (error, action) => {
  const status = error.response?.status;
  const detail = stringifyProviderError(error.response?.data);
  const suffix = detail ? `: ${detail}` : '';
  const message = status
    ? `D-ID ${action} failed (${status})${suffix}`
    : `D-ID ${action} failed: ${error.message}`;
  const normalizedError = new Error(message);
  normalizedError.cause = error;
  return normalizedError;
};

export const getDIDTalk = async (talkId) => {
  let response;

  try {
    response = await retry(() =>
      axios.get(`https://api.d-id.com/talks/${talkId}`, {
        headers: { Authorization: getAuthorizationHeader() }
      })
    );
  } catch (error) {
    throw normalizeDIDError(error, 'get talk');
  }

  return response.data;
};

export const createDIDTalk = async ({ audioUrl, avatarId, webhookUrl, userData }) => {
  if (!env.didApiKey) {
    if (env.allowMockProviders) return null;
    throw new Error(
      'DID_API_KEY is required. Set ALLOW_MOCK_PROVIDERS=true only for local pipeline testing.'
    );
  }

  try {
    new URL(avatarId);
  } catch {
    throw new Error('avatarId must be a publicly accessible image URL when using D-ID.');
  }

  const body = {
    source_url: avatarId,
    script: {
      type: 'audio',
      audio_url: audioUrl
    }
  };

  if (webhookUrl) body.webhook = webhookUrl;
  if (userData) body.user_data = JSON.stringify(userData);

  let createResponse;

  try {
    createResponse = await retry(() =>
      axios.post(
        'https://api.d-id.com/talks',
        body,
        {
          headers: {
            Authorization: getAuthorizationHeader(),
            'Content-Type': 'application/json'
          }
        }
      )
    );
  } catch (error) {
    throw normalizeDIDError(error, 'create talk');
  }

  logger.info('DID_TALK_CREATED', { talkId: createResponse.data.id });
  return createResponse.data;
};

export const generateAvatarWithDID = async ({ audioUrl, avatarId }) => {
  const createdTalk = await createDIDTalk({ audioUrl, avatarId });
  if (!createdTalk) return null;

  const talkId = createdTalk.id;
  const deadline = Date.now() + env.didTimeoutMs;
  let lastStatus = 'created';

  while (Date.now() < deadline) {
    const talk = await getDIDTalk(talkId);
    const nextStatus = talk.status;
    if (nextStatus !== lastStatus) {
      lastStatus = nextStatus;
      logger.info('DID_TALK_STATUS_CHANGED', { talkId, status: nextStatus });
    }

    if (nextStatus === 'done') {
      return talk.result_url;
    }

    if (nextStatus === 'error' || nextStatus === 'rejected') {
      throw new Error(talk.error?.description || 'D-ID avatar generation failed');
    }

    await new Promise((resolve) => setTimeout(resolve, env.didPollIntervalMs));
  }

  throw new Error(
    `D-ID avatar generation timed out after ${Math.round(env.didTimeoutMs / 1000)} seconds ` +
      `(talkId: ${talkId}, last status: ${lastStatus})`
  );
};
