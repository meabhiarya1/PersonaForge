import { generateVoiceWithElevenLabs } from './providers/elevenlabs.provider.js';

export const generateVoice = async (scriptData) => {
  return generateVoiceWithElevenLabs(scriptData);
};
