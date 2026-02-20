/**
 * @module minions-sdk/storage/filterUtils
 * Shared filtering and sorting logic used by all storage adapters.
 */

import type { Minion } from '../types/index.js';
import type { StorageFilter } from './StorageAdapter.js';

/**
 * Apply a {@link StorageFilter} to an array of minions.
 *
 * Handles soft-delete exclusion, field-level filtering (type, status, tags),
 * sorting, and pagination (limit / offset).
 */
export function applyFilter(minions: Minion[], filter: StorageFilter): Minion[] {
  let result = minions;

  if (!filter.includeDeleted) {
    result = result.filter((m) => !m.deletedAt);
  }
  if (filter.minionTypeId !== undefined) {
    result = result.filter((m) => m.minionTypeId === filter.minionTypeId);
  }
  if (filter.status !== undefined) {
    result = result.filter((m) => m.status === filter.status);
  }
  if (filter.tags && filter.tags.length > 0) {
    result = result.filter((m) =>
      filter.tags!.every((tag) => m.tags?.includes(tag)),
    );
  }

  // ── Sorting ────────────────────────────────────────────────────────────
  if (filter.sortBy) {
    const order = filter.sortOrder === 'desc' ? -1 : 1;
    result = [...result].sort((a, b) => {
      let aVal: string;
      let bVal: string;

      switch (filter.sortBy) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'createdAt':
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;
        case 'updatedAt':
          aVal = a.updatedAt;
          bVal = b.updatedAt;
          break;
        default:
          return 0;
      }

      return aVal < bVal ? -order : aVal > bVal ? order : 0;
    });
  }

  // ── Pagination ─────────────────────────────────────────────────────────
  const offset = filter.offset ?? 0;
  result = result.slice(offset);

  if (filter.limit !== undefined) {
    result = result.slice(0, filter.limit);
  }

  return result;
}
