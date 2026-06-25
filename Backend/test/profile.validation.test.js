import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCreateProfileInput,
  validateUpdateProfileInput
} from '../src/validations/profile.validation.js';

test('creator profile create input applies safe defaults', () => {
  const input = validateCreateProfileInput({ name: 'Developer Explainer' });

  assert.equal(input.name, 'Developer Explainer');
  assert.equal(input.language, 'English');
  assert.equal(input.targetAudience, 'general audience');
  assert.equal(input.style, 'educational');
  assert.equal(input.duration, 60);
  assert.equal(input.avatarId, 'default-avatar');
});

test('creator profile update input does not apply create defaults', () => {
  const input = validateUpdateProfileInput({ language: 'Hinglish' });

  assert.deepEqual(input, { language: 'Hinglish' });
});

test('creator profile update requires at least one field', () => {
  assert.throws(() => validateUpdateProfileInput({}), /At least one profile field is required/);
});
