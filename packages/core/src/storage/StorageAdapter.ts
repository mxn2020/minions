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
}
