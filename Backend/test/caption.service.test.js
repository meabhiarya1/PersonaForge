import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCaptionContent,
  toTimestamp
} from '../src/services/caption/caption.service.js';

test('formats SRT timestamps including milliseconds', () => {
  assert.equal(toTimestamp(3.5), '00:00:03,500');
  assert.equal(toTimestamp(65.25), '00:01:05,250');
});

test('caption segments cover the real duration without gaps', () => {
  const content = buildCaptionContent(
    {
      script: 'Fallback text',
      scenes: [
        { caption: 'First scene' },
        { caption: 'Second scene' }
      ]
    },
    7
  );

  assert.match(content, /00:00:00,000 --> 00:00:03,500/);
  assert.match(content, /00:00:03,500 --> 00:00:07,000/);
  assert.match(content, /First scene/);
  assert.match(content, /Second scene/);
});

test('falls back to the complete script when scenes are absent', () => {
  const content = buildCaptionContent({ script: 'Complete script', scenes: [] }, 5);

  assert.match(content, /00:00:00,000 --> 00:00:05,000/);
  assert.match(content, /Complete script/);
});
