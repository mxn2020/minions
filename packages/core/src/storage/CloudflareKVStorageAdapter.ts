/**
 * @module minions-sdk/storage/cloudflare-kv
 * Cloudflare Workers KV storage adapter for the Minions structured object system.
 *
 * Designed for use in Cloudflare Workers.  All data is stored in a KV namespace,
 * with each minion serialised as a JSON string under a namespaced key.
 *
 * The adapter does NOT depend on `@cloudflare/workers-types` at compile time —
 * it defines a minimal `KVNamespaceLike` interface (the same peer-dep pattern
 * used by the Convex and Supabase adapters).
 *
 * @example
 * ```typescript
 * import { CloudflareKVStorageAdapter } from 'minions-sdk';
 *
 * export default {
 *   async fetch(request: Request, env: Env) {
 *     const storage = new CloudflareKVStorageAdapter(env.MINIONS_KV);
 *     const minions = new Minions({ storage });
 *     // …
 *   },
 * };
 * ```
 */

import type { Minion } from '../types/index.js';
import type { StorageAdapter, StorageFilter } from './StorageAdapter.js';
import { applyFilter } from './filterUtils.js';

// ─── Cloudflare KV Types ─────────────────────────────────────────────────────
//
// Minimal interfaces so the adapter compiles without @cloudflare/workers-types
// installed.  Any real Cloudflare KV namespace binding satisfies this contract.

/** Result item returned by `KVNamespace.list()`. */
export interface KVListKey {
  name: string;
  expiration?: number;
  metadata?: unknown;
}

/** Result returned by `KVNamespace.list()`. */
export interface KVListResult {
  keys: KVListKey[];
  list_complete: boolean;
  cursor?: string;
}

/**
 * Minimal interface for a Cloudflare Workers KV namespace.
 *
 * Any real `KVNamespace` binding from a Cloudflare Worker environment satisfies
 * this contract.  By using this interface, the adapter compiles without
 * requiring `@cloudflare/workers-types` as a direct dependency.
 */
export interface KVNamespaceLike {
  get(key: string, options?: { type?: string }): Promise<string | null>;
  put(key: string, value: string, options?: { metadata?: unknown }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<KVListResult>;
}

// ─── Configuration ───────────────────────────────────────────────────────────

/** Options for the Cloudflare KV storage adapter. */
export interface CloudflareKVStorageOptions {
  /**
   * Key prefix used for all minion entries.
   * Default: `"minion:"`.  The resulting key format is `<prefix><minion.id>`.
   */
  prefix?: string;
  /**
   * Key prefix used for attachment file entries.
   * Default: `"file:"`.  The resulting key format is `<filePrefix><minionId>:<filename>`.
   */
  filePrefix?: string;
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

/**
 * Storage adapter backed by **Cloudflare Workers KV**.
 *
 * Each minion is stored as a JSON-serialised string under the key
 * `<prefix><id>`.  Listing is performed via KV `list()` with cursor-based
 * pagination, then filtering/sorting is applied client-side using the
 * shared {@link applyFilter} utility.
 *
 * **Setup**: Bind a KV namespace to your Worker in `wrangler.toml`:
 *
 * ```toml
 * [[kv_namespaces]]
 * binding = "MINIONS_KV"
 * id = "your-kv-namespace-id"
 * ```
 *
 * Then pass the binding to the constructor:
 *
 * ```typescript
 * const storage = new CloudflareKVStorageAdapter(env.MINIONS_KV);
 * ```
 *
 * @example
 * ```typescript
 * import { Minions, CloudflareKVStorageAdapter } from 'minions-sdk';
 *
 * export default {
 *   async fetch(request: Request, env: Env) {
 *     const storage = new CloudflareKVStorageAdapter(env.MINIONS_KV);
 *     const minions = new Minions({ storage });
 *
 *     const agent = await minions.create('agent', {
 *       title: 'My Agent',
 *       fields: { role: 'assistant', model: 'gpt-4' },
 *     });
 *
 *     return Response.json({ id: agent.data.id });
 *   },
 * };
 * ```
 */
export class CloudflareKVStorageAdapter implements StorageAdapter {
  private kv: KVNamespaceLike;
  private prefix: string;
  private filePrefix: string;

  constructor(kv: KVNamespaceLike, options?: CloudflareKVStorageOptions) {
    this.kv = kv;
    this.prefix = options?.prefix ?? 'minion:';
    this.filePrefix = options?.filePrefix ?? 'file:';
  }

  // ── Core CRUD ───────────────────────────────────────────────────────────

  async get(id: string): Promise<Minion | undefined> {
    const raw = await this.kv.get(this.prefix + id);
    if (!raw) return undefined;
    return JSON.parse(raw) as Minion;
  }

  async set(minion: Minion): Promise<void> {
    await this.kv.put(this.prefix + minion.id, JSON.stringify(minion));
  }

  async delete(id: string): Promise<void> {
    await this.kv.delete(this.prefix + id);

    // Clean up any attachment files
    const fileKeyPrefix = this.filePrefix + id + ':';
    let cursor: string | undefined;
    do {
      const result = await this.kv.list({ prefix: fileKeyPrefix, cursor });
      for (const key of result.keys) {
        await this.kv.delete(key.name);
      }
      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);
  }

  async list(filter?: StorageFilter): Promise<Minion[]> {
    const all = await this.fetchAllMinions();

    if (!filter) {
      return all.filter((m) => !m.deletedAt);
    }
    return applyFilter(all, filter);
  }

  async search(query: string): Promise<Minion[]> {
    if (!query.trim()) return this.list();

    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const all = await this.list();

    return all.filter((m) => {
      const text = (m.searchableText ?? m.title).toLowerCase();
      return tokens.every((token) => text.includes(token));
    });
  }

  // ── Attachment File Operations ──────────────────────────────────────────

  async putFile(id: string, filename: string, data: Uint8Array): Promise<void> {
    // KV stores strings; we base64-encode binary data
    const b64 = this.uint8ArrayToBase64(data);
    await this.kv.put(this.fileKey(id, filename), b64);
  }

  async getFile(id: string, filename: string): Promise<Uint8Array | undefined> {
    const raw = await this.kv.get(this.fileKey(id, filename));
    if (!raw) return undefined;
    return this.base64ToUint8Array(raw);
  }

  async deleteFile(id: string, filename: string): Promise<void> {
    await this.kv.delete(this.fileKey(id, filename));
  }

  async listFiles(id: string): Promise<string[]> {
    const prefix = this.filePrefix + id + ':';
    const filenames: string[] = [];
    let cursor: string | undefined;

    do {
      const result = await this.kv.list({ prefix, cursor });
      for (const key of result.keys) {
        filenames.push(key.name.slice(prefix.length));
      }
      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);

    return filenames;
  }

  // ── Internal Helpers ───────────────────────────────────────────────────

  /**
   * Fetch all minion entries from KV using cursor-based pagination.
   * KV `list()` returns at most 1000 keys per call.
   */
  private async fetchAllMinions(): Promise<Minion[]> {
    const minions: Minion[] = [];
    let cursor: string | undefined;

    do {
      const result = await this.kv.list({ prefix: this.prefix, cursor });
      const values = await Promise.all(
        result.keys.map((key) => this.kv.get(key.name)),
      );

      for (const raw of values) {
        if (raw) {
          try {
            minions.push(JSON.parse(raw) as Minion);
          } catch {
            // Skip malformed entries
          }
        }
      }

      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);

    return minions;
  }

  /** Build the KV key for an attachment file. */
  private fileKey(id: string, filename: string): string {
    return `${this.filePrefix}${id}:${filename}`;
  }

  /** Convert Uint8Array to base64 string (works in Workers runtime). */
  private uint8ArrayToBase64(data: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
  }

  /** Convert base64 string back to Uint8Array. */
  private base64ToUint8Array(b64: string): Uint8Array {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
