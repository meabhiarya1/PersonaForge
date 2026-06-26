import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildScriptQualityMeta,
  getTargetSceneCount,
  normalizeScenes
} from '../src/utils/scriptQuality.js';

test('chooses target scene count from duration', () => {
  assert.equal(getTargetSceneCount(15), 3);
  assert.equal(getTargetSceneCount(60), 4);
  assert.equal(getTargetSceneCount(120), 6);
});

test('normalizes scenes with purpose and captions', () => {
  const scenes = normalizeScenes({
    scenes: [{ sceneNumber: 1, text: 'Hello world' }],
    script: 'Hello world',
    duration: 60,
    topic: 'Testing'
  });

  assert.equal(scenes[0].purpose, 'hook');
  assert.equal(scenes[0].caption, 'Hello world');
  assert.match(scenes[0].visualInstruction, /Testing/);
});

test('builds script quality metadata', () => {
  const meta = buildScriptQualityMeta({
    script: 'one two three',
    scenes: [{ purpose: 'hook' }, { purpose: 'takeaway' }],
    input: {
      duration: 60,
      language: 'English',
      style: 'educational',
      targetAudience: 'developers'
    },
    durationMeta: { withinTargetRange: true }
  });

  assert.equal(meta.sceneCount, 2);
  assert.equal(meta.language, 'English');
  assert.equal(meta.durationWithinTarget, true);
  assert.equal(meta.structure, 'hook -> takeaway');
});
