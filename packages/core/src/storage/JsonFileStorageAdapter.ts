/**
 * @module minions-sdk/storage/json-file
 * Disk-based JSON storage adapter with sharded directory layout and
 * in-memory index for fast queries / full-text search.
 *
 * Directory layout (flat mode — default)
 * ──────────────────────────────────────
 *   <rootDir>/<id[0..1]>/<id[2..3]>/<id>.json
 *
 * Directory layout (directory mode — opt-in)
 * ──────────────────────────────────────────
 *   <rootDir>/<id[0..1]>/<id[2..3]>/<id>/
 *     ├── minion.json     ← the Minion object
 *     └── ...             ← attachment files
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
 * Writes use a write-to-tmp-then-rename pattern to avoid partial writes
 * corrupting data if the process crashes mid-write.
 *
 * The adapter can **read both flat and directory layouts** regardless of
 * its configured mode, so migration is seamless.
 *
 * This adapter uses Node.js `node:fs/promises`, so it is only suitable for
 * server-side / CLI usage.
 */

import { mkdir, readFile, writeFile, unlink, readdir, rename, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { Minion } from '../types/index.js';
import type { StorageAdapter, StorageFilter, FileStorageOptions } from './StorageAdapter.js';
import { applyFilter } from './filterUtils.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Derive the shard sub-path for a given minion id. */
function shardPath(rootDir: string, id: string): string {
  // Remove hyphens so the first real hex digits are always at positions 0 and 2
  const hex = id.replace(/-/g, '');
  return join(rootDir, hex.slice(0, 2), hex.slice(2, 4));
}

/** Flat-mode path: `shard/<id>.json` */
function flatFilePath(rootDir: string, id: string): string {
  return join(shardPath(rootDir, id), `${id}.json`);
}

/** Directory-mode directory: `shard/<id>/` */
function minionDir(rootDir: string, id: string): string {
  return join(shardPath(rootDir, id), id);
}

/** Directory-mode primary file: `shard/<id>/minion.json` */
function dirFilePath(rootDir: string, id: string): string {
  return join(minionDir(rootDir, id), 'minion.json');
}

/** Name of the primary data file inside a minion directory. */
const PRIMARY_FILE = 'minion.json';

// ─── Adapter ─────────────────────────────────────────────────────────────────

/**
 * Disk-backed JSON storage adapter.
 *
 * @example
 * ```typescript
 * import { Minions } from 'minions-sdk';
 * import { JsonFileStorageAdapter } from 'minions-sdk/storage';
 *
 * // Flat mode (default)
 * const storage = await JsonFileStorageAdapter.create('./data/minions');
 *
 * // Directory mode (enables attachments)
 * const storage = await JsonFileStorageAdapter.create('./data/minions', { directoryMode: true });
 *
 * const minions = new Minions({ storage });
 * const wrapper = minions.create('note', { title: 'Hello', fields: { content: 'World' } });
 * await minions.save(wrapper.data);
 *
 * // Attach a file (directory mode only)
 * await storage.putFile(wrapper.data.id, 'readme.md', Buffer.from('# Hello'));
 * ```
 */
export class JsonFileStorageAdapter implements StorageAdapter {
  private index: Map<string, Minion> = new Map();
  private readonly directoryMode: boolean;

  private constructor(
    private readonly rootDir: string,
    options?: FileStorageOptions,
  ) {
    this.directoryMode = options?.directoryMode ?? false;
  }

  /**
   * Create (or open) a `JsonFileStorageAdapter` rooted at `rootDir`.
   *
   * The directory is created if it does not yet exist.  All existing JSON
   * files underneath it are loaded into the in-memory index.
   *
   * @param options - Optional. Set `directoryMode: true` to enable
   *   directory-per-minion layout with attachment file support.
   */
  static async create(
    rootDir: string,
    options?: FileStorageOptions,
  ): Promise<JsonFileStorageAdapter> {
    const adapter = new JsonFileStorageAdapter(rootDir, options);
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
   *
   * Detects both flat files (`<id>.json`) and directory entries
   * (`<id>/minion.json`) so the adapter can read data written in either
   * mode.
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
        let entries: string[];
        try {
          entries = await readdir(l2Path);
        } catch {
          continue;
        }

        for (const entry of entries) {
          const entryPath = join(l2Path, entry);

          // Case 1: flat file  →  <id>.json
          if (entry.endsWith('.json')) {
            try {
              const raw = await readFile(entryPath, 'utf8');
              const minion = JSON.parse(raw) as Minion;
              if (minion.id) this.index.set(minion.id, minion);
            } catch (err) {
              if (err instanceof SyntaxError) continue;
              const code = (err as NodeJS.ErrnoException).code;
              if (code === 'ENOENT' || code === 'EACCES' || code === 'EISDIR') continue;
              throw err;
            }
            continue;
          }

          // Case 2: directory  →  <id>/minion.json
          try {
            const info = await stat(entryPath);
            if (!info.isDirectory()) continue;
            const primaryPath = join(entryPath, PRIMARY_FILE);
            const raw = await readFile(primaryPath, 'utf8');
            const minion = JSON.parse(raw) as Minion;
            if (minion.id) this.index.set(minion.id, minion);
          } catch (err) {
            if (err instanceof SyntaxError) continue;
            const code = (err as NodeJS.ErrnoException).code;
            if (code === 'ENOENT' || code === 'EACCES' || code === 'ENOTDIR') continue;
            throw err;
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
    if (this.directoryMode) {
      const dir = minionDir(this.rootDir, minion.id);
      await mkdir(dir, { recursive: true });
      const target = dirFilePath(this.rootDir, minion.id);
      const tmp = `${target}.tmp`;
      await writeFile(tmp, JSON.stringify(minion, null, 2), 'utf8');
      await rename(tmp, target);
    } else {
      const dir = shardPath(this.rootDir, minion.id);
      await mkdir(dir, { recursive: true });
      const target = flatFilePath(this.rootDir, minion.id);
      const tmp = `${target}.tmp`;
      await writeFile(tmp, JSON.stringify(minion, null, 2), 'utf8');
      await rename(tmp, target);
    }

    this.index.set(minion.id, minion);
  }

  async delete(id: string): Promise<void> {
    this.index.delete(id);

    // Try directory-mode path first, then flat-mode path
    const dir = minionDir(this.rootDir, id);
    try {
      const info = await stat(dir);
      if (info.isDirectory()) {
        await rm(dir, { recursive: true, force: true });
        return;
      }
    } catch {
      // Not a directory, try flat
    }

    try {
      await unlink(flatFilePath(this.rootDir, id));
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
      const text = (m.searchableText ?? m.title).toLowerCase();
      return tokens.every((token) => text.includes(token));
    });
  }

  // ── Attachment file operations ─────────────────────────────────────────

  async putFile(id: string, filename: string, data: Uint8Array): Promise<void> {
    const dir = minionDir(this.rootDir, id);
    await mkdir(dir, { recursive: true });

    // If a flat file exists and we're adding attachments, migrate it to directory mode
    if (!this.directoryMode) {
      const flatPath = flatFilePath(this.rootDir, id);
      try {
        const raw = await readFile(flatPath, 'utf8');
        await writeFile(join(dir, PRIMARY_FILE), raw, 'utf8');
        await unlink(flatPath);
      } catch {
        // No flat file to migrate
      }
    }

    const filePath = join(dir, filename);
    await writeFile(filePath, data);
  }

  async getFile(id: string, filename: string): Promise<Uint8Array | undefined> {
    const fp = join(minionDir(this.rootDir, id), filename);
    try {
      const buf = await readFile(fp);
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    } catch {
      return undefined;
    }
  }

  async deleteFile(id: string, filename: string): Promise<void> {
    const filePath = join(minionDir(this.rootDir, id), filename);
    try {
      await unlink(filePath);
    } catch {
      // Silently ignore missing files
    }
  }

  async listFiles(id: string): Promise<string[]> {
    const dir = minionDir(this.rootDir, id);
    try {
      const entries = await readdir(dir);
      return entries.filter((e) => e !== PRIMARY_FILE);
    } catch {
      return [];
    }
  }
}
