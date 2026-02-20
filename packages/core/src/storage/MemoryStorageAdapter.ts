/**
 * @module minions-sdk/storage/memory
 * In-memory storage adapter — useful for testing and ephemeral workloads.
 */

import type { Minion } from '../types/index.js';
import type { StorageAdapter, StorageFilter } from './StorageAdapter.js';
import { applyFilter } from './filterUtils.js';

/**
 * Simple in-memory storage adapter.
 *
 * All data is stored in a `Map` and is lost when the process exits.
 * This is the default adapter when no persistence is required and is well
 * suited for unit tests.
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private store: Map<string, Minion> = new Map();

  async get(id: string): Promise<Minion | undefined> {
    return this.store.get(id);
  }

  async set(minion: Minion): Promise<void> {
    this.store.set(minion.id, minion);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async list(filter?: StorageFilter): Promise<Minion[]> {
    const all = Array.from(this.store.values());
    if (!filter) {
      return all.filter((m) => !m.deletedAt);
    }
    return applyFilter(all, filter);
  }

  async search(query: string): Promise<Minion[]> {
    if (!query.trim()) return this.list();

    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const all = Array.from(this.store.values()).filter((m) => !m.deletedAt);

    return all.filter((m) => {
      const text = (m.searchableText ?? m.title).toLowerCase();
      return tokens.every((token) => text.includes(token));
    });
  }
}
