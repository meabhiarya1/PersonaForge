import test from 'node:test';
import assert from 'node:assert/strict';
import { chunkText, cosineSimilarity } from '../src/services/memory/vectorMath.js';

test('chunkText creates overlapping chunks without a duplicate trailing chunk', () => {
  const chunks = chunkText('one two three four five six seven', { chunkSize: 4, overlap: 2 });
  assert.deepEqual(chunks, ['one two three four', 'three four five six', 'five six seven']);
});

test('cosineSimilarity ranks identical vectors above unrelated vectors', () => {
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
});
