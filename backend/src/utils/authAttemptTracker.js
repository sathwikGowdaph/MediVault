/**
 * In-Memory Authentication Attempt Tracker & Progressive Throttler
 * - Tracks failed login attempts per account/IP.
 * - Resets tracking immediately on successful login.
 * - Applies progressive throttling for rapid consecutive failures without locking users out.
 */

const attemptsMap = new Map();
const inProgressSet = new Set();

/**
 * Clean up stale attempt records older than 15 minutes.
 */
setInterval(() => {
  const now = Date.now();
  const FIFTEEN_MINUTES = 15 * 60 * 1000;
  for (const [key, data] of attemptsMap.entries()) {
    if (now - data.lastAttemptAt > FIFTEEN_MINUTES) {
      attemptsMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Record a failed authentication attempt.
 */
export function recordFailedAttempt(identifier) {
  if (!identifier) return;
  const key = identifier.toLowerCase().trim();
  const existing = attemptsMap.get(key) || { count: 0, firstAttemptAt: Date.now(), lastAttemptAt: Date.now() };

  existing.count += 1;
  existing.lastAttemptAt = Date.now();
  attemptsMap.set(key, existing);
}

/**
 * Get attempt tracking details for an identifier.
 */
export function getAttemptInfo(identifier) {
  if (!identifier) return { count: 0, lastAttemptAt: null };
  const key = identifier.toLowerCase().trim();
  const existing = attemptsMap.get(key);
  return existing ? { count: existing.count, lastAttemptAt: existing.lastAttemptAt } : { count: 0, lastAttemptAt: null };
}

/**
 * Reset failed attempt tracking upon successful authentication.
 */
export function resetAttemptTracker(identifier) {
  if (!identifier) return;
  const key = identifier.toLowerCase().trim();
  attemptsMap.delete(key);
}

/**
 * Mark the start of an authentication attempt for this identifier.
 * Used to prevent rapid duplicate/concurrent login requests for the same account.
 */
export function beginAttempt(identifier) {
  if (!identifier) return false;
  const key = identifier.toLowerCase().trim();
  if (inProgressSet.has(key)) return false; // already in progress
  inProgressSet.add(key);
  return true;
}

/**
 * Mark the end of an authentication attempt for this identifier.
 */
export function endAttempt(identifier) {
  if (!identifier) return;
  const key = identifier.toLowerCase().trim();
  inProgressSet.delete(key);
}

/**
 * Apply progressive delay for repeated failed attempts.
 * Returns the delay applied in milliseconds.
 */
export async function applyThrottleDelay(identifier) {
  if (!identifier) return 0;
  const { count } = getAttemptInfo(identifier);
  if (count < 3) return 0;

  // Progressive delay: 300ms, 600ms, 1000ms, max 1500ms
  const delay = Math.min(300 * Math.pow(1.4, count - 3), 1500);
  // If an attempt is already in progress for this identifier, add a small extra delay
  const key = identifier.toLowerCase().trim();
  const extra = inProgressSet.has(key) ? 300 : 0;
  const total = Math.round(delay + extra);
  await new Promise((resolve) => setTimeout(resolve, total));
  return total;
}
