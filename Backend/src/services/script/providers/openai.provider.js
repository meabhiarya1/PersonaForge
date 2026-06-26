import axios from 'axios';
import env from '../../../config/env.js';
import { retry } from '../../../utils/retry.js';
import { getDurationWordBudget } from '../../../utils/scriptDuration.js';

const fallbackScript = (input) => ({
  title: input.topic,
  hook: input.analysisData?.suggestedAngle || `Let's understand ${input.topic} in a simple way.`,
  script: [
    `${input.topic}.`,
    input.analysisData?.summary || input.notes || '',
    `This video explains the concept for ${input.targetAudience}.`
  ].filter(Boolean).join(' '),
  scenes: [
    {
      sceneNumber: 1,
      text: `Today we will explain ${input.topic}.`,
      visualInstruction: 'Presenter faces camera with a clean educational background.',
      caption: `Today we will explain ${input.topic}.`
    },
    {
      sceneNumber: 2,
      text: input.analysisData?.keyPoints?.join(' ') || input.notes || `Break down ${input.topic} with a simple example.`,
      visualInstruction: 'Show simple visual examples beside the avatar.',
      caption: input.analysisData?.mainIdea || input.notes || `Break down ${input.topic} with a simple example.`
    }
  ]
});

export const generateScriptWithOpenAI = async (input) => {
  const wordBudget = getDurationWordBudget(input.duration);

  if (!env.openaiApiKey) {
    if (env.allowMockProviders) return fallbackScript(input);
    throw new Error(
      'OPENAI_API_KEY is required. Set ALLOW_MOCK_PROVIDERS=true only for local pipeline testing.'
    );
  }

  const systemPrompt = [
    'You are an expert short-form educational video writer.',
    'Return only valid JSON with title, hook, script, and scenes.',
    'Each scene must have sceneNumber, text, visualInstruction, and caption.',
    'The script length must closely match the requested duration.',
    `Write around ${wordBudget.targetWords} spoken words, with an acceptable range of ${wordBudget.minWords}-${wordBudget.maxWords} words.`,
    'Do not write a very short summary when the requested duration is longer.',
    'Scene text should collectively cover the full script.'
  ].join(' ');

  const userPrompt = {
    topic: input.topic,
    notes: input.notes,
    userIntent: input.userIntent || '',
    alignmentData: input.alignmentData || null,
    contentAnalysis: input.analysisData || null,
    language: input.language,
    duration: input.duration,
    wordBudget,
    targetAudience: input.targetAudience,
    style: input.style
  };

  const response = await retry(() =>
    axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(userPrompt) }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${env.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
  );

  return JSON.parse(response.data.choices[0].message.content);
};
