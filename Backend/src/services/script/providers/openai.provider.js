import axios from 'axios';
import env from '../../../config/env.js';
import { retry } from '../../../utils/retry.js';
import { getDurationWordBudget } from '../../../utils/scriptDuration.js';
import { getTargetSceneCount } from '../../../utils/scriptQuality.js';

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
      purpose: 'hook',
      text: `Today we will explain ${input.topic}.`,
      visualInstruction: 'Presenter faces camera with a clean educational background.',
      caption: `Today we will explain ${input.topic}.`
    },
    {
      sceneNumber: 2,
      purpose: 'explain',
      text: input.analysisData?.keyPoints?.join(' ') || input.notes || `Break down ${input.topic} with a simple example.`,
      visualInstruction: 'Show simple visual examples beside the avatar.',
      caption: input.analysisData?.mainIdea || input.notes || `Break down ${input.topic} with a simple example.`
    }
  ]
});

export const generateScriptWithOpenAI = async (input) => {
  const wordBudget = getDurationWordBudget(input.duration);
  const targetSceneCount = getTargetSceneCount(input.duration);

  if (!env.openaiApiKey) {
    if (env.allowMockProviders) return fallbackScript(input);
    throw new Error(
      'OPENAI_API_KEY is required. Set ALLOW_MOCK_PROVIDERS=true only for local pipeline testing.'
    );
  }

  const systemPrompt = [
    'You are an expert short-form educational video writer.',
    'Return only valid JSON with title, hook, script, scenes, and qualityNotes.',
    'Each scene must have sceneNumber, purpose, text, visualInstruction, and caption.',
    'Use this narrative structure: hook -> context -> explanation -> example -> takeaway.',
    `Create about ${targetSceneCount} scenes unless the content requires a small adjustment.`,
    'Each scene purpose must be one of hook, context, explain, example, takeaway, transition, warning, recap.',
    'The script length must closely match the requested duration.',
    `Write around ${wordBudget.targetWords} spoken words, with an acceptable range of ${wordBudget.minWords}-${wordBudget.maxWords} words.`,
    'Do not write a very short summary when the requested duration is longer.',
    'Scene text should collectively cover the full script.',
    'Strictly follow the requested language. If language is Hinglish, use natural Hindi-English mix. If Hindi, use Hindi. If English, use English.',
    'Use the contentAnalysis and alignmentData to avoid drifting away from the confirmed user intent.'
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
    targetSceneCount,
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
