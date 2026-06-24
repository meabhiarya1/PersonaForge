import { generateVoiceWithElevenLabs } from './providers/elevenlabs.provider.js';

export const generateVoice = async (scriptData, options = {}) => {
  return generateVoiceWithElevenLabs(scriptData, options);
};
