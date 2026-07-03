export const chunkText = (text, { chunkSize = 180, overlap = 30 } = {}) => {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  if (chunkSize <= 0 || overlap < 0 || overlap >= chunkSize) {
    throw new Error('Chunk size must be positive and overlap must be smaller than chunk size.');
  }

  const chunks = [];
  const step = chunkSize - overlap;
  for (let start = 0; start < words.length; start += step) {
    const content = words.slice(start, start + chunkSize).join(' ');
    if (content) chunks.push(content);
    if (start + chunkSize >= words.length) break;
  }
  return chunks;
};

export const cosineSimilarity = (left, right) => {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || !left.length) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }

  if (!leftMagnitude || !rightMagnitude) return 0;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
};
