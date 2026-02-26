/**
 * @module minions-sdk/storage
 * Storage abstraction layer for the Minions structured object system.
 *
 * The `StorageAdapter` interface is the single contract that all storage
 * backends must satisfy.  New backends (Postgres, MongoDB, Supabase, …) can
 * be added later by implementing this interface without touching the rest of
 * the SDK.
 */

import type { Minion } from '../types/index.js';

// ─── Options ─────────────────────────────────────────────────────────────────

/**
 * Options for file-based storage adapters.
 *
 * When `directoryMode` is enabled, each minion is stored as a directory
 * containing a primary data file (`minion.json` / `minion.yaml`) plus
 * optional attachment files:
 *
 * ```
 *   <rootDir>/<shard>/<uuid>/
 *     ├── minion.yaml      ← the Minion object
 *     └── ...              ← attachments
 * ```
 *
 * When disabled (the default), the original flat layout is used:
 *
 * ```
 *   <rootDir>/<shard>/<uuid>.yaml
 * ```
 */
export interface FileStorageOptions {
  /**
   * Use directory-per-minion layout, enabling attachment file storage.
   * Default: `false` (flat file).
   */
  directoryMode?: boolean;
}

// ─── Filter / Query ──────────────────────────────────────────────────────────

/** Options for filtering the result set when listing minions. */
export interface StorageFilter {
  /** Only return minions of this type. */
  minionTypeId?: string;
  /** Only return minions with this status. */
  status?: string;
  /** When true, include soft-deleted minions. Defaults to false. */
  includeDeleted?: boolean;
  /** Only return minions that have all of the given tags. */
  tags?: string[];
  /** Maximum number of results to return. */
  limit?: number;
  /** Number of results to skip (for pagination). */
  offset?: number;
  /** Sort results by this field. */
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  /** Sort direction. Defaults to ascending. */
  sortOrder?: 'asc' | 'desc';
}

// ─── Adapter Interface ───────────────────────────────────────────────────────

/**
 * Storage adapter interface.
 *
 * Every backend implementation must satisfy this contract.  All methods are
 * asynchronous so that adapters backed by remote databases work identically
 * to local / in-process ones.
 */
export interface StorageAdapter {
  /**
   * Retrieve a single minion by its ID.
   * Returns `undefined` when no matching minion exists.
   */
  get(id: string): Promise<Minion | undefined>;

  /**
   * Persist a minion.
   * If a minion with the same `id` already exists it is overwritten.
   */
  set(minion: Minion): Promise<void>;

  /**
   * Remove a minion by its ID.
   * Resolves silently even if no matching minion exists.
   */
  delete(id: string): Promise<void>;

  /**
   * List all stored minions, with optional filtering.
   */
  list(filter?: StorageFilter): Promise<Minion[]>;

  /**
   * Full-text search across stored minions.
   *
   * The query is matched case-insensitively against the pre-computed
   * `searchableText` field (title + description + string-like fields).
   * Returns minions where `searchableText` contains every token in the query.
   */
  search(query: string): Promise<Minion[]>;

  // ── Attachment file operations (optional) ──────────────────────────────
  //
  // These methods are available when the adapter supports directory mode.
  // Adapters that don't support attachments simply omit them.

  /**
   * Write an attachment file for a minion.
   * The file is stored alongside the minion's primary data file.
   * Overwrites if the file already exists.
   */
  putFile?(id: string, filename: string, data: Uint8Array): Promise<void>;

  /**
   * Read an attachment file for a minion.
   * Returns `undefined` if the file or minion does not exist.
   */
  getFile?(id: string, filename: string): Promise<Uint8Array | undefined>;

  /**
   * Delete an attachment file for a minion.
   * Resolves silently if the file does not exist.
   */
  deleteFile?(id: string, filename: string): Promise<void>;

  /**
   * List all attachment filenames for a minion.
   * Returns an empty array if the minion has no attachments or
   * the adapter is not in directory mode.
   */
  listFiles?(id: string): Promise<string[]>;
}
