import { generateScriptWithOpenAI } from './providers/openai.provider.js';
import {
  countWords,
  estimateDurationFromWords,
  getDurationWordBudget
} from '../../utils/scriptDuration.js';

const expandShortScript = ({ script, input, analysisData, minWords }) => {
  const expansionBlocks = [
    analysisData?.summary ? `Here is the core idea in simple terms: ${analysisData.summary}` : '',
    analysisData?.keyPoints?.length
      ? `The important points are: ${analysisData.keyPoints.join(' ')}`
      : '',
    input.notes ? `Now let us connect this with the user's notes: ${input.notes}` : '',
    `A practical way to understand ${input.topic} is to first define it, then look at why it matters, then walk through one simple example.`,
    `By the end, the viewer should remember the main concept, the reason it is useful, and one clear situation where it applies.`
  ].filter(Boolean);

  let expanded = script;
  let index = 0;

  while (countWords(expanded) < minWords && index < expansionBlocks.length) {
    expanded = `${expanded}\n\n${expansionBlocks[index]}`;
    index += 1;
  }

  return expanded;
};

const normalizeScriptForDuration = ({ scriptData, input, analysisData }) => {
  const wordBudget = getDurationWordBudget(input.duration);
  let script = scriptData.script || scriptData.scenes?.map((scene) => scene.text).join(' ') || '';
  let wordCount = countWords(script);

  if (wordCount < wordBudget.minWords) {
    script = expandShortScript({
      script,
      input,
      analysisData,
      minWords: wordBudget.minWords
    });
    wordCount = countWords(script);
  }

  return {
    ...scriptData,
    script,
    durationMeta: {
      requestedDuration: wordBudget.duration,
      targetWords: wordBudget.targetWords,
      minWords: wordBudget.minWords,
      maxWords: wordBudget.maxWords,
      actualWords: wordCount,
      estimatedDuration: estimateDurationFromWords(wordCount),
      withinTargetRange: wordCount >= wordBudget.minWords && wordCount <= wordBudget.maxWords
    }
  };
};

export const generateScript = async (input, analysisData = null) => {
  const scriptData = await generateScriptWithOpenAI({
    ...input,
    analysisData
  });

  return normalizeScriptForDuration({
    scriptData: {
      title: scriptData.title || input.topic,
      hook: scriptData.hook || '',
      script: scriptData.script || '',
      scenes: Array.isArray(scriptData.scenes) ? scriptData.scenes : []
    },
    input,
    analysisData
  });
};
