/**
 * @module minions-sdk/utils
 * Internal utility functions.
 */

/**
 * Generate a UUID v4 string.
 * Uses crypto.randomUUID when available, otherwise falls back to a simple implementation.
 */
export function generateId(): string {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get the current time as an ISO 8601 string.
 */
export function now(): string {
  return new Date().toISOString();
}
