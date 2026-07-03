import axios from 'axios';
import { PDFParse } from 'pdf-parse';
import env from '../../config/env.js';
import AppError from '../../utils/AppError.js';
import { retry } from '../../utils/retry.js';

const MAX_EXTRACTED_CHARACTERS = 20000;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const SUPPORTED_PDF_TYPES = new Set(['application/pdf']);

export const SOURCE_FILE_LIMITS = {
  maxFiles: 8,
  maxFileSizeBytes: 12 * 1024 * 1024,
  acceptedMimeTypes: [...SUPPORTED_PDF_TYPES, ...SUPPORTED_IMAGE_TYPES]
};

export const isSupportedSourceMimeType = (mimeType) =>
  SOURCE_FILE_LIMITS.acceptedMimeTypes.includes(mimeType);

export const normalizeExtractedText = (value = '') =>
  String(value)
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

const truncateWithWarning = (text, warnings) => {
  if (text.length <= MAX_EXTRACTED_CHARACTERS) return text;

  warnings.push(
    `Extracted text was longer than ${MAX_EXTRACTED_CHARACTERS} characters and was trimmed for analysis.`
  );
  return text.slice(0, MAX_EXTRACTED_CHARACTERS).trim();
};

const extractPdfText = async (file) => {
  const parser = new PDFParse({ data: file.buffer });

  try {
    const result = await parser.getText();
    return normalizeExtractedText(result?.text || '');
  } finally {
    await parser.destroy();
  }
};

const fileToDataUrl = (file) => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

const extractImageTextWithOpenAI = async (files) => {
  if (!files.length) return '';

  if (!env.openaiApiKey) {
    if (env.allowMockProviders) {
      return files
        .map((file, index) => `[Mock OCR ${index + 1}] ${file.originalname}: image text extraction requires OPENAI_API_KEY.`)
        .join('\n\n');
    }

    throw new AppError('OPENAI_API_KEY is required to extract text from screenshots/images.', 503);
  }

  const imageContent = files.flatMap((file, index) => [
    {
      type: 'text',
      text: `Image ${index + 1}: ${file.originalname}`
    },
    {
      type: 'image_url',
      image_url: {
        url: fileToDataUrl(file),
        detail: 'high'
      }
    }
  ]);

  const response = await retry(() =>
    axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: [
              'You extract usable source material from screenshots and images for a video-generation app.',
              'Return plain text only.',
              'Preserve important headings, bullet points, code, equations, and labels.',
              'If the image contains diagrams or UI but little readable text, describe the useful content briefly.',
              'Do not invent content that is not visible.'
            ].join(' ')
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all useful readable text and source context from these images. Keep it concise but complete enough for script analysis.'
              },
              ...imageContent
            ]
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

  return normalizeExtractedText(response.data.choices?.[0]?.message?.content || '');
};

export const extractSourceMaterial = async ({ files = [], pastedText = '' }) => {
  const warnings = [];
  const pdfFiles = files.filter((file) => SUPPORTED_PDF_TYPES.has(file.mimetype));
  const imageFiles = files.filter((file) => SUPPORTED_IMAGE_TYPES.has(file.mimetype));

  const unsupportedFiles = files.filter((file) => !isSupportedSourceMimeType(file.mimetype));
  if (unsupportedFiles.length) {
    throw new AppError(
      `Unsupported file type: ${unsupportedFiles.map((file) => file.originalname).join(', ')}`,
      400
    );
  }

  const parts = [];
  const pasted = normalizeExtractedText(pastedText);
  if (pasted) {
    parts.push({
      type: 'pasted_text',
      label: 'Pasted text',
      text: pasted
    });
  }

  for (const file of pdfFiles) {
    const text = await extractPdfText(file);
    if (text) {
      parts.push({
        type: 'pdf',
        label: file.originalname,
        text
      });
    } else {
      warnings.push(
        `${file.originalname} did not contain selectable text. If it is a scanned PDF, upload page screenshots/images for OCR.`
      );
    }
  }

  if (imageFiles.length) {
    const text = await extractImageTextWithOpenAI(imageFiles);
    if (text) {
      parts.push({
        type: 'image_ocr',
        label: imageFiles.map((file) => file.originalname).join(', '),
        text
      });
    }
  }

  const extractedText = truncateWithWarning(
    normalizeExtractedText(
      parts
        .map((part) => `Source: ${part.label}\n${part.text}`)
        .filter(Boolean)
        .join('\n\n---\n\n')
    ),
    warnings
  );

  if (!extractedText) {
    throw new AppError('No readable text could be extracted from the provided source.', 400);
  }

  return {
    extractedText,
    characterCount: extractedText.length,
    sourceCount: parts.length,
    sources: parts.map((part) => ({
      type: part.type,
      label: part.label,
      characterCount: part.text.length
    })),
    warnings
  };
};
