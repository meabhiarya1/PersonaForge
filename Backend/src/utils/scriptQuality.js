import { countWords, estimateDurationFromWords } from './scriptDuration.js';

export const getTargetSceneCount = (duration = 60) => {
  const normalizedDuration = Math.min(Math.max(Number(duration) || 60, 15), 600);

  if (normalizedDuration <= 30) return 3;
  if (normalizedDuration <= 60) return 4;
  if (normalizedDuration <= 120) return 6;
  if (normalizedDuration <= 300) return 8;
  return 10;
};

const scenePurposes = ['hook', 'context', 'explain', 'example', 'takeaway'];

export const normalizeScenes = ({ scenes = [], script = '', duration = 60, topic = '' }) => {
  const targetSceneCount = getTargetSceneCount(duration);
  const sourceScenes = scenes.length
    ? scenes
    : [
        {
          sceneNumber: 1,
          purpose: 'explain',
          text: script,
          visualInstruction: `Show a clear educational visual for ${topic}.`,
          caption: script
        }
      ];

  return sourceScenes.map((scene, index) => {
    const purpose = scene.purpose || scenePurposes[Math.min(index, scenePurposes.length - 1)];
    const text = scene.text || scene.caption || script;

    return {
      sceneNumber: Number(scene.sceneNumber || index + 1),
      purpose,
      text,
      visualInstruction:
        scene.visualInstruction ||
        `Show a simple visual that supports the ${purpose} section of ${topic}.`,
      caption: scene.caption || text
    };
  }).slice(0, Math.max(targetSceneCount + 2, sourceScenes.length));
};

export const buildScriptQualityMeta = ({ script, scenes, input, durationMeta }) => {
  const wordCount = countWords(script);
  const sceneCount = scenes.length;
  const purposes = scenes.map((scene) => scene.purpose).filter(Boolean);

  return {
    structure: purposes.join(' -> ') || 'hook -> explain -> example -> takeaway',
    sceneCount,
    targetSceneCount: getTargetSceneCount(input.duration),
    wordCount,
    estimatedDuration: estimateDurationFromWords(wordCount),
    requestedDuration: Number(input.duration || 60),
    language: input.language || 'English',
    style: input.style || 'educational',
    targetAudience: input.targetAudience || 'general audience',
    durationWithinTarget: Boolean(durationMeta?.withinTargetRange)
  };
};
