import axios from 'axios';
import env from '../../../config/env.js';
import { retry } from '../../../utils/retry.js';

const fallbackScript = (input) => ({
  title: input.topic,
  hook: `Let's understand ${input.topic} in a simple way.`,
  script: `${input.topic}. ${input.notes || ''} This video explains the concept for ${input.targetAudience}.`,
  scenes: [
    {
      sceneNumber: 1,
      text: `Today we will explain ${input.topic}.`,
      visualInstruction: 'Presenter faces camera with a clean educational background.',
      caption: `Today we will explain ${input.topic}.`
    },
    {
      sceneNumber: 2,
      text: input.notes || `Break down ${input.topic} with a simple example.`,
      visualInstruction: 'Show simple visual examples beside the avatar.',
      caption: input.notes || `Break down ${input.topic} with a simple example.`
    }
  ]
});

export const generateScriptWithOpenAI = async (input) => {
  if (!env.openaiApiKey) {
    return fallbackScript(input);
  }

  const systemPrompt = [
    'You are an expert short-form educational video writer.',
    'Return only valid JSON with title, hook, script, and scenes.',
    'Each scene must have sceneNumber, text, visualInstruction, and caption.'
  ].join(' ');

  const userPrompt = {
    topic: input.topic,
    notes: input.notes,
    language: input.language,
    duration: input.duration,
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
