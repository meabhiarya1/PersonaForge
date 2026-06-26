import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGenerateVideoInput } from '../src/validations/video.validation.js';

test('generate video input defaults to simple prompt mode', () => {
  const input = validateGenerateVideoInput({
    topic: 'Explain closures'
  });

  assert.equal(input.inputType, 'simple_prompt');
  assert.equal(input.referenceText, '');
});

test('reference text mode requires enough source text', () => {
  assert.throws(
    () =>
      validateGenerateVideoInput({
        topic: 'Explain closures',
        inputType: 'reference_text',
        referenceText: 'too short'
      }),
    /Reference text must be at least 50 characters/
  );
});

test('reference text mode accepts long source text', () => {
  const input = validateGenerateVideoInput({
    topic: 'Explain closures',
    inputType: 'reference_text',
    referenceText: 'Closures are functions that remember variables from their outer lexical scope even after that scope has returned.'
  });

  assert.equal(input.inputType, 'reference_text');
  assert.match(input.referenceText, /Closures/);
});
