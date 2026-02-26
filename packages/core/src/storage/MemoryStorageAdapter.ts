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
 *
 * Supports the optional attachment file operations using an in-memory store.
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private store: Map<string, Minion> = new Map();
  private files: Map<string, Map<string, Uint8Array>> = new Map();

  async get(id: string): Promise<Minion | undefined> {
    return this.store.get(id);
  }

  async set(minion: Minion): Promise<void> {
    this.store.set(minion.id, minion);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
    this.files.delete(id);
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

  // ── Attachment file operations ─────────────────────────────────────────

  async putFile(id: string, filename: string, data: Uint8Array): Promise<void> {
    let bucket = this.files.get(id);
    if (!bucket) {
      bucket = new Map();
      this.files.set(id, bucket);
    }
    bucket.set(filename, new Uint8Array(data));
  }

  async getFile(id: string, filename: string): Promise<Uint8Array | undefined> {
    return this.files.get(id)?.get(filename);
  }

  async deleteFile(id: string, filename: string): Promise<void> {
    this.files.get(id)?.delete(filename);
  }

  async listFiles(id: string): Promise<string[]> {
    const bucket = this.files.get(id);
    return bucket ? Array.from(bucket.keys()) : [];
  }
}
