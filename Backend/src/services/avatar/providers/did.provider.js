import axios from 'axios';
import env from '../../../config/env.js';
import { retry } from '../../../utils/retry.js';

export const generateAvatarWithDID = async ({ audioUrl, avatarId }) => {
  if (!env.didApiKey) {
    return null;
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
          Authorization: `Basic ${env.didApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
  );

  const talkId = createResponse.data.id;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const statusResponse = await axios.get(`https://api.d-id.com/talks/${talkId}`, {
      headers: { Authorization: `Basic ${env.didApiKey}` }
    });

    if (statusResponse.data.status === 'done') {
      return statusResponse.data.result_url;
    }

    if (statusResponse.data.status === 'error') {
      throw new Error(statusResponse.data.error?.description || 'D-ID avatar generation failed');
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error('D-ID avatar generation timed out');
};
