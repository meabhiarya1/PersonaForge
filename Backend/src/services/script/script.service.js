import { generateScriptWithOpenAI } from './providers/openai.provider.js';

export const generateScript = async (input) => {
  const scriptData = await generateScriptWithOpenAI(input);

  return {
    title: scriptData.title || input.topic,
    hook: scriptData.hook || '',
    script: scriptData.script || '',
    scenes: Array.isArray(scriptData.scenes) ? scriptData.scenes : []
  };
};
