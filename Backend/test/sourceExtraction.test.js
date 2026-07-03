import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSupportedSourceMimeType,
  normalizeExtractedText
} from '../src/services/content/sourceExtraction.service.js';

test('normalizes extracted source text', () => {
  assert.equal(
    normalizeExtractedText(' Heading  \r\n\r\n\r\nPoint   one  \nPoint two  \n'),
    'Heading\n\nPoint one\nPoint two'
  );
});

test('accepts only supported source mime types', () => {
  assert.equal(isSupportedSourceMimeType('application/pdf'), true);
  assert.equal(isSupportedSourceMimeType('image/jpeg'), true);
  assert.equal(isSupportedSourceMimeType('image/png'), true);
  assert.equal(isSupportedSourceMimeType('image/webp'), true);
  assert.equal(isSupportedSourceMimeType('text/html'), false);
});
