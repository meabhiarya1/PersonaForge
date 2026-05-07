export const safeJsonParse = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const safeJsonStringify = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  return JSON.stringify(value);
};
