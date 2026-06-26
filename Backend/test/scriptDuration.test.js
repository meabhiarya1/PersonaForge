import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countWords,
  estimateDurationFromWords,
  getDurationWordBudget
} from '../src/utils/scriptDuration.js';

test('calculates a spoken-word budget from requested duration', () => {
  const budget = getDurationWordBudget(60);

  assert.equal(budget.duration, 60);
  assert.equal(budget.targetWords, 145);
  assert.ok(budget.minWords >= 120);
  assert.ok(budget.maxWords <= 170);
});

test('estimates duration from word count', () => {
  assert.equal(estimateDurationFromWords(145), 60);
});

test('counts words safely', () => {
  assert.equal(countWords(' one   two\nthree '), 3);
});
