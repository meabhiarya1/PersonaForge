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

const normalizeAlignment = (alignment, input) => ({
  intent: alignment.intent || 'unclear',
  alignmentScore: Number.isFinite(Number(alignment.alignmentScore))
    ? Math.min(Math.max(Number(alignment.alignmentScore), 0), 1)
    : 0,
  topicsDetected: Array.isArray(alignment.topicsDetected) ? alignment.topicsDetected : [],
  relationship: alignment.relationship || '',
  risk: ['low', 'medium', 'high'].includes(alignment.risk) ? alignment.risk : 'medium',
  recommendation: ['continue', 'ask_user', 'warn_continue'].includes(alignment.recommendation)
    ? alignment.recommendation
    : 'ask_user',
  question:
    alignment.question ||
    'Please confirm how PersonaForge should use the topic and reference text together.',
  suggestedReplies: Array.isArray(alignment.suggestedReplies)
    ? alignment.suggestedReplies.slice(0, 4)
    : [
        'Use the reference only as background context.',
        'Explain both topics together in one video.',
        'Ignore the reference and follow the topic only.'
      ],
  usedUserClarification: Boolean(input.userIntent)
});

const fallbackAlignment = (input) => {
  const topicWords = new Set(
    String(input.topic)
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((word) => word.length > 3)
  );
  const referenceWords = new Set(
    String(input.referenceText)
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((word) => word.length > 3)
  );
  const overlap = [...topicWords].filter((word) => referenceWords.has(word)).length;
  const score = input.userIntent ? 0.78 : Math.min(0.3 + overlap * 0.18, 0.92);
  const risk = score >= 0.75 ? 'low' : score >= 0.45 ? 'medium' : 'high';

  return {
    intent: input.userIntent ? 'user_clarified' : 'unclear',
    alignmentScore: score,
    topicsDetected: [...topicWords].slice(0, 5),
    relationship: input.userIntent
      ? `User clarified intent: ${input.userIntent}`
      : 'Fallback check found limited topic/reference overlap. Confirm the intended relationship before generation.',
    risk,
    recommendation: risk === 'high' && !input.userIntent ? 'ask_user' : 'warn_continue',
    question: 'How should PersonaForge use this reference text with your topic?',
    suggestedReplies: [
      'Use the reference only as background context.',
      'Explain both topics together in one video.',
      'Focus on the topic and ignore unrelated reference parts.',
      'Change the video topic to match the reference.'
    ],
    usedUserClarification: Boolean(input.userIntent)
  };
};

export const analyzeInputIntent = async (input) => {
  if (input.inputType !== 'reference_text') {
    return normalizeAlignment(
      {
        intent: 'single_topic',
        alignmentScore: 1,
        topicsDetected: [input.topic],
        relationship: 'Simple prompt mode does not require reference alignment.',
        risk: 'low',
        recommendation: 'continue',
        question: '',
        suggestedReplies: []
      },
      input
    );
  }

  if (!env.openaiApiKey) {
    if (env.allowMockProviders) return fallbackAlignment(input);
    throw new Error(
      'OPENAI_API_KEY is required for input intent checking. Set ALLOW_MOCK_PROVIDERS=true only for local pipeline testing.'
    );
  }

  const systemPrompt = [
    'You are an input intent and topic-reference alignment guard for an AI video generator.',
    'Do not require a perfect single-topic match.',
    'Allow related multi-topic, comparison, prerequisite, and background-context use cases.',
    'Detect accidental mismatches, irrelevant references, unclear intent, and missing context.',
    'Return only valid JSON with intent, alignmentScore, topicsDetected, relationship, risk, recommendation, question, and suggestedReplies.',
    'intent must be one of single_topic, related_multi_topic, comparison, prerequisite_or_context, unrelated_reference, unclear_intent, user_clarified.',
    'risk must be low, medium, or high.',
    'recommendation must be continue, ask_user, or warn_continue.',
    'suggestedReplies should give the user 3-4 short choices they can select or edit.'
  ].join(' ');

  const response = await retry(() =>
    axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: JSON.stringify({
              topic: input.topic,
              notes: input.notes,
              referenceText: input.referenceText,
              userClarification: input.userIntent,
              language: input.language,
              duration: input.duration,
              targetAudience: input.targetAudience,
              style: input.style
            })
          }
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

  return normalizeAlignment(JSON.parse(response.data.choices[0].message.content), input);
};

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
    userIntent: input.userIntent,
    alignmentData: input.alignmentData,
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
