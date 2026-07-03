import axios from 'axios';
import env from '../../config/env.js';
import AppError from '../../utils/AppError.js';

const mockEmbedding = (text, dimensions) => {
  const vector = Array(dimensions).fill(0);
  String(text).toLowerCase().split(/\W+/).filter(Boolean).forEach((word) => {
    let hash = 2166136261;
    for (const character of word) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    vector[Math.abs(hash) % dimensions] += 1;
  });
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0)) || 1;
  return vector.map((value) => value / magnitude);
};

export const generateEmbeddings = async (inputs) => {
  const normalizedInputs = inputs.map((input) => String(input || '').trim());
  if (!normalizedInputs.length || normalizedInputs.some((input) => !input)) {
    throw new AppError('Embedding input cannot be empty.', 400);
  }

  if (!env.openaiApiKey) {
    if (env.allowMockProviders) {
      return normalizedInputs.map((input) => mockEmbedding(input, env.embeddingDimensions));
    }
    throw new AppError('OPENAI_API_KEY is required to generate embeddings.', 503);
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        model: env.embeddingModel,
        input: normalizedInputs,
        dimensions: env.embeddingDimensions,
        encoding_format: 'float'
      },
      {
        headers: {
          Authorization: `Bearer ${env.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    return response.data.data
      .sort((left, right) => left.index - right.index)
      .map(({ embedding }) => embedding);
  } catch (error) {
    const detail = error.response?.data?.error?.message || error.message;
    throw new AppError(`Embedding generation failed: ${detail}`, error.response?.status || 502);
  }
};
