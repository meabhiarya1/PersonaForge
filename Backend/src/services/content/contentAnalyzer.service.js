import axios from 'axios';
import env from '../../config/env.js';
import { retry } from '../../utils/retry.js';

const fallbackAnalysis = (input) => {
  const sourceText = [input.topic, input.notes, input.referenceText].filter(Boolean).join(' ');
  const summary = sourceText.slice(0, 500) || `Reference content about ${input.topic}`;

  return {
    summary,
    mainIdea: input.topic,
    keyPoints: [
      input.topic,
      input.notes || 'Explain the most important idea clearly.',
      'Use a simple example and practical takeaway.'
    ].filter(Boolean),
    suggestedAngle: `Explain ${input.topic} for ${input.targetAudience}.`,
    missingContext: [],
    contentWarnings: [],
    sceneIdeas: [
      {
        scene: 1,
        purpose: 'hook',
        message: `Introduce why ${input.topic} matters.`
      },
      {
        scene: 2,
        purpose: 'explain',
        message: 'Break down the key points from the reference text.'
      },
      {
        scene: 3,
        purpose: 'takeaway',
        message: 'End with a practical summary.'
      }
    ]
  };
};

const normalizeAnalysis = (analysis, input) => ({
  summary: analysis.summary || '',
  mainIdea: analysis.mainIdea || input.topic,
  keyPoints: Array.isArray(analysis.keyPoints) ? analysis.keyPoints : [],
  suggestedAngle: analysis.suggestedAngle || '',
  missingContext: Array.isArray(analysis.missingContext) ? analysis.missingContext : [],
  contentWarnings: Array.isArray(analysis.contentWarnings) ? analysis.contentWarnings : [],
  sceneIdeas: Array.isArray(analysis.sceneIdeas) ? analysis.sceneIdeas : []
});

export const analyzeContent = async (input) => {
  if (input.inputType !== 'reference_text') return null;

  if (!env.openaiApiKey) {
    if (env.allowMockProviders) return fallbackAnalysis(input);
    throw new Error(
      'OPENAI_API_KEY is required for content analysis. Set ALLOW_MOCK_PROVIDERS=true only for local pipeline testing.'
    );
  }

  const systemPrompt = [
    'You are a content analyst for short educational video generation.',
    'Analyze the provided source content before script writing.',
    'Return only valid JSON with summary, mainIdea, keyPoints, suggestedAngle, missingContext, contentWarnings, and sceneIdeas.',
    'sceneIdeas must be an array of objects with scene, purpose, and message.'
  ].join(' ');

  const userPrompt = {
    topic: input.topic,
    notes: input.notes,
    referenceText: input.referenceText,
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

  return normalizeAnalysis(JSON.parse(response.data.choices[0].message.content), input);
};
