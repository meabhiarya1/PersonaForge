import axios from 'axios';
import fs from 'fs/promises';
import env from '../../../config/env.js';
import { storageConfig } from '../../../config/storage.js';
import { createFileName, ensureDir } from '../../../utils/file.js';
import { retry } from '../../../utils/retry.js';

export const generateVoiceWithElevenLabs = async (scriptData) => {
  await ensureDir(storageConfig.audioDir);
  const outputPath = `${storageConfig.audioDir}/${createFileName('voice', 'mp3')}`;
  const text = scriptData.script || scriptData.scenes.map((scene) => scene.text).join(' ');

  if (!env.elevenLabsApiKey) {
    await fs.writeFile(outputPath, '');
    return outputPath;
  }

  const response = await retry(() =>
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

  await fs.writeFile(outputPath, response.data);
  return outputPath;
};
