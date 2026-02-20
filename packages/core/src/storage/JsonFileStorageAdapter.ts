/**
 * @module minions-sdk/storage/json-file
 * Disk-based JSON storage adapter with sharded directory layout and
 * in-memory index for fast queries / full-text search.
 *
 * Directory layout
 * ────────────────
 * Each minion is stored as a pretty-printed JSON file:
 *
 *   <rootDir>/<id[0..1]>/<id[2..3]>/<id>.json
 *
 * The two-level shard prefix keeps individual directories small even when
 * millions of minions are stored, while still being human-readable and
 * git-friendly.
 *
 * Index
 * ─────
 * An in-memory `Map<id, Minion>` is populated at construction time by
 * scanning the root directory.  All subsequent reads hit the index first
 * (O(1)), falling back to disk only when the entry is missing (which should
 * not happen in normal usage).  Writes update both disk and the index
 * atomically (from the caller's perspective).
 *
 * This adapter uses Node.js `node:fs/promises`, so it is only suitable for
 * server-side / CLI usage.
 */

import { mkdir, readFile, writeFile, unlink, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Minion } from '../types/index.js';
import type { StorageAdapter, StorageFilter } from './StorageAdapter.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Derive the shard sub-path for a given minion id. */
function shardPath(rootDir: string, id: string): string {
  // Remove hyphens so the first real hex digits are always at positions 0 and 2
  const hex = id.replace(/-/g, '');
  return join(rootDir, hex.slice(0, 2), hex.slice(2, 4));
}

/** Full path to the JSON file for a given minion id. */
function filePath(rootDir: string, id: string): string {
  return join(shardPath(rootDir, id), `${id}.json`);
}

/** Apply a {@link StorageFilter} to an array of minions. */
function applyFilter(minions: Minion[], filter: StorageFilter): Minion[] {
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

  const offset = filter.offset ?? 0;
  result = result.slice(offset);

  if (filter.limit !== undefined) {
    result = result.slice(0, filter.limit);
  }

  return result;
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

/**
 * Disk-backed JSON storage adapter.
 *
 * @example
 * ```typescript
 * import { Minions } from 'minions-sdk';
 * import { JsonFileStorageAdapter } from 'minions-sdk/storage';
 *
 * const storage = await JsonFileStorageAdapter.create('./data/minions');
 * const minions = new Minions({ storage });
 *
 * const wrapper = minions.create('note', { title: 'Hello', fields: { content: 'World' } });
 * await minions.save(wrapper.data);
 * ```
 */
export class JsonFileStorageAdapter implements StorageAdapter {
  private index: Map<string, Minion> = new Map();

  private constructor(private readonly rootDir: string) {}

  /**
   * Create (or open) a `JsonFileStorageAdapter` rooted at `rootDir`.
   *
   * The directory is created if it does not yet exist.  All existing JSON
   * files underneath it are loaded into the in-memory index.
   */
  static async create(rootDir: string): Promise<JsonFileStorageAdapter> {
    const adapter = new JsonFileStorageAdapter(rootDir);
    await adapter.init();
    return adapter;
  }

  // ── Initialisation ──────────────────────────────────────────────────────

  private async init(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
    await this.buildIndex();
  }

  /**
   * Walk the sharded directory tree and populate the in-memory index.
   * Missing or malformed files are silently skipped.
   */
  private async buildIndex(): Promise<void> {
    let shardDirs: string[];
    try {
      shardDirs = await readdir(this.rootDir);
    } catch {
      return;
    }

    for (const l1 of shardDirs) {
      const l1Path = join(this.rootDir, l1);
      let l2Dirs: string[];
      try {
        l2Dirs = await readdir(l1Path);
      } catch {
        continue;
      }

      for (const l2 of l2Dirs) {
        const l2Path = join(l1Path, l2);
        let files: string[];
        try {
          files = await readdir(l2Path);
        } catch {
          continue;
        }

        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          try {
            const raw = await readFile(join(l2Path, file), 'utf8');
            const minion = JSON.parse(raw) as Minion;
            this.index.set(minion.id, minion);
          } catch {
            // Silently skip unreadable / corrupt files
          }
        }
      }
    }
  }

  // ── StorageAdapter implementation ───────────────────────────────────────

  async get(id: string): Promise<Minion | undefined> {
    return this.index.get(id);
  }

  async set(minion: Minion): Promise<void> {
    const dir = shardPath(this.rootDir, minion.id);
    await mkdir(dir, { recursive: true });
    await writeFile(filePath(this.rootDir, minion.id), JSON.stringify(minion, null, 2), 'utf8');
    this.index.set(minion.id, minion);
  }

  async delete(id: string): Promise<void> {
    this.index.delete(id);
    try {
      await unlink(filePath(this.rootDir, id));
    } catch {
      // Silently ignore missing files
    }
  }

  async list(filter?: StorageFilter): Promise<Minion[]> {
    const all = Array.from(this.index.values());
    if (!filter) {
      return all.filter((m) => !m.deletedAt);
    }
    return applyFilter(all, filter);
  }

  async search(query: string): Promise<Minion[]> {
    if (!query.trim()) return this.list();

    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const all = Array.from(this.index.values()).filter((m) => !m.deletedAt);

    return all.filter((m) => {
      const text = m.searchableText ?? m.title.toLowerCase();
      return tokens.every((token) => text.includes(token));
    });
  }
}
