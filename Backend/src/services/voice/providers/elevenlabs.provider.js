import axios from 'axios';
import fs from 'fs/promises';
import env from '../../../config/env.js';
import { storageConfig } from '../../../config/storage.js';
import { createFileName, ensureDir } from '../../../utils/file.js';
import { retry } from '../../../utils/retry.js';
import { runFfmpeg } from '../../../utils/media.js';

const estimateSpeechDuration = (text, requestedDuration) => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const estimated = Math.max(3, Math.ceil(words / 2.4));
  return requestedDuration ? Math.min(estimated, requestedDuration) : estimated;
};

const createMockAudio = async (outputPath, duration) => {
  await runFfmpeg([
    '-f',
    'lavfi',
    '-i',
    'anullsrc=r=44100:cl=mono',
    '-t',
    String(duration),
    '-c:a',
    'libmp3lame',
    outputPath
  ]);
};

export const generateVoiceWithElevenLabs = async (scriptData, { duration } = {}) => {
  await ensureDir(storageConfig.audioDir);
  const outputPath = `${storageConfig.audioDir}/${createFileName('voice', 'mp3')}`;
  const text = scriptData.script || scriptData.scenes.map((scene) => scene.text).join(' ');

  if (!env.elevenLabsApiKey) {
    if (!env.allowMockProviders) {
      throw new Error(
        'ELEVENLABS_API_KEY is required. Set ALLOW_MOCK_PROVIDERS=true only for local pipeline testing.'
      );
    }
    await createMockAudio(outputPath, estimateSpeechDuration(text, duration));
    return outputPath;
  }

  let response;

  try {
    response = await retry(() =>
      axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${env.elevenLabsVoiceId}`,
        {
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8
          }
        },
        {
          responseType: 'arraybuffer',
          headers: {
            'xi-api-key': env.elevenLabsApiKey,
            'Content-Type': 'application/json'
          }
        }
      )
    );
  } catch (error) {
    const status = error.response?.status;
    let providerMessage = error.message;

    if (error.response?.data) {
      try {
        const decoded = Buffer.from(error.response.data).toString('utf8');
        const data = JSON.parse(decoded);
        providerMessage = data.detail?.message || data.detail || data.message || decoded;
      } catch {
        providerMessage = Buffer.from(error.response.data).toString('utf8') || error.message;
      }
    }

    throw new Error(`ElevenLabs TTS failed${status ? ` (${status})` : ''}: ${providerMessage}`);
  }

  await fs.writeFile(outputPath, response.data);
  return outputPath;
};
