export const spokenWordsPerMinute = 145;

export const countWords = (text = '') => text.trim().split(/\s+/).filter(Boolean).length;

export const getDurationWordBudget = (duration = 60) => {
  const normalizedDuration = Math.min(Math.max(Number(duration) || 60, 15), 600);
  const targetWords = Math.round((normalizedDuration / 60) * spokenWordsPerMinute);

  return {
    duration: normalizedDuration,
    targetWords,
    minWords: Math.round(targetWords * 0.85),
    maxWords: Math.round(targetWords * 1.15)
  };
};

export const estimateDurationFromWords = (wordCount) => Math.round((wordCount / spokenWordsPerMinute) * 60);
