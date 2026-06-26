import test from 'node:test';
import assert from 'node:assert/strict';
import { extractDIDTalkId } from '../src/utils/didWebhook.js';

test('extracts the canonical D-ID id field', () => {
  assert.equal(extractDIDTalkId({ id: 'tlk_123' }), 'tlk_123');
});

test('accepts the talk_id compatibility field', () => {
  assert.equal(extractDIDTalkId({ talk_id: 'tlk_456' }), 'tlk_456');
});

test('returns null for an invalid webhook payload', () => {
  assert.equal(extractDIDTalkId({ status: 'done' }), null);
});
