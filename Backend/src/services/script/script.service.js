import { generateScriptWithOpenAI } from './providers/openai.provider.js';

export const generateScript = async (input, analysisData = null) => {
  const scriptData = await generateScriptWithOpenAI({
    ...input,
    analysisData
  });

  return {
    title: scriptData.title || input.topic,
    hook: scriptData.hook || '',
    script: scriptData.script || '',
    scenes: Array.isArray(scriptData.scenes) ? scriptData.scenes : []
  };
};
