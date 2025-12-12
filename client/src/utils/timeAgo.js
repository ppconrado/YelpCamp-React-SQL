/**
 * Format a timestamp to relative time (e.g., "2 minutes ago")
 * @param {string | Date} timestamp - ISO timestamp or Date object
 * @returns {string} Human-readable relative time
 */
export const timeAgo = (timestamp, nowInput) => {
  if (!timestamp) return '';

  const now = nowInput ? new Date(nowInput) : new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60)
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24)
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  if (diffWeeks < 4)
    return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  if (diffMonths < 12)
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
};

// Derive a creation timestamp from a Mongo ObjectId if createdAt is missing.
// Returns ISO string.
export const deriveTimestampFromId = (id, createdAt) => {
  if (createdAt) return createdAt;
  if (!id || typeof id !== 'string' || id.length < 8) return null;
  try {
    // First 8 hex chars = seconds since epoch
    const seconds = parseInt(id.substring(0, 8), 16);
    return new Date(seconds * 1000).toISOString();
  } catch {
    return null;
  }
};
