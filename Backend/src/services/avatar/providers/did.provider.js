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

export const getDIDTalk = async (talkId) => {
  const response = await retry(() =>
    axios.get(`https://api.d-id.com/talks/${talkId}`, {
      headers: { Authorization: getAuthorizationHeader() }
    })
  );

  return response.data;
};

export const generateAvatarWithDID = async ({ audioUrl, avatarId }) => {
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

  const createResponse = await retry(() =>
    axios.post(
      'https://api.d-id.com/talks',
      {
        source_url: avatarId,
        script: {
          type: 'audio',
          audio_url: audioUrl
        }
      },
      {
        headers: {
          Authorization: getAuthorizationHeader(),
          'Content-Type': 'application/json'
        }
      }
    )
  );

  const talkId = createResponse.data.id;
  const deadline = Date.now() + env.didTimeoutMs;
  let lastStatus = 'created';

  logger.info('DID_TALK_CREATED', { talkId });

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
