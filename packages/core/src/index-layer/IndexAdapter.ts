/**
 * @module minions-sdk/index-layer
 * Index layer abstraction for the Minions structured object system.
 *
 * The `IndexAdapter` interface is the single contract that all index
 * backends must satisfy.  The index layer is **optional** — when configured
 * alongside a `StorageAdapter`, it enables fast listing, filtering, and
 * full-text search without touching the (potentially slow) data layer.
 *
 * When only a `StorageAdapter` is configured (single-layer mode), the SDK
 * falls back to querying the data layer directly, preserving full backwards
 * compatibility.
 */

import type { Minion } from '../types/index.js';
import type { StorageFilter } from '../storage/StorageAdapter.js';

// ─── Index Entry ─────────────────────────────────────────────────────────────

/**
 * Lightweight projection of a {@link Minion} stored in the index layer.
 *
 * Contains enough data to render table / grid / list views without loading
 * the full minion from the data layer.  The `searchableText` field is
 * auto-populated by {@link toIndexEntry} with a truncated concatenation of
 * the minion's title, description, and string-like field values.
 */
export interface IndexEntry {
    /** Minion UUID — matches the full Minion's `id`. */
    id: string;
    /** Human-readable title. */
    title: string;
    /** Optional longer description. */
    description?: string;
    /** Reference to the MinionType. */
    minionTypeId: string;
    /** Lifecycle status. */
    status?: string;
    /** Priority level. */
    priority?: string;
    /** Freeform tags. */
    tags?: string[];
    /**
     * Pre-computed searchable text.
     * Auto-populated by {@link toIndexEntry} from the minion's title,
     * description, and string-valued fields, truncated to a reasonable length.
     */
    searchableText: string;
    /** ISO 8601 creation timestamp. */
    createdAt: string;
    /** ISO 8601 last-update timestamp. */
    updatedAt: string;
    /** ISO 8601 soft-delete timestamp. Null/undefined if not deleted. */
    deletedAt?: string | null;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Maximum character length for the auto-generated `searchableText` field.
 * Keeps index entries lightweight while still providing useful FTS coverage.
 */
const MAX_SEARCHABLE_LENGTH = 2000;

/**
 * Extract an {@link IndexEntry} from a full {@link Minion}.
 *
 * The `searchableText` field is built by concatenating:
 * 1. `minion.title`
 * 2. `minion.description` (if present)
 * 3. All string-valued entries from `minion.fields`
 *
 * The result is lowercased and truncated to {@link MAX_SEARCHABLE_LENGTH}.
 *
 * If the minion already has a `searchableText` field, it is used as-is
 * (preserving any custom computation done at creation time).
 */
export function toIndexEntry(minion: Minion): IndexEntry {
    let searchableText: string;

    if (minion.searchableText) {
        searchableText = minion.searchableText;
    } else {
        const parts: string[] = [minion.title];

        if (minion.description) {
            parts.push(minion.description);
        }

        if (minion.fields) {
            for (const value of Object.values(minion.fields)) {
                if (typeof value === 'string' && value.length > 0) {
                    parts.push(value);
                }
            }
        }

        searchableText = parts.join(' ').slice(0, MAX_SEARCHABLE_LENGTH);
    }

    return {
        id: minion.id,
        title: minion.title,
        description: minion.description,
        minionTypeId: minion.minionTypeId,
        status: minion.status,
        priority: minion.priority,
        tags: minion.tags,
        searchableText,
        createdAt: minion.createdAt,
        updatedAt: minion.updatedAt,
        deletedAt: minion.deletedAt,
    };
}

// ─── Adapter Interface ───────────────────────────────────────────────────────

/**
 * Index adapter interface.
 *
 * Every index backend implementation must satisfy this contract.  All methods
 * are asynchronous so that adapters backed by remote databases work
 * identically to local / in-process ones.
 *
 * The index layer is used for **fast queries only** — it never stores the
 * full minion data.  Individual minion loading always goes through the
 * data layer (`StorageAdapter.get()`).
 */
export interface IndexAdapter {
    /**
     * Insert or update an index entry.
     * If an entry with the same `id` already exists, it is overwritten.
     */
    upsert(entry: IndexEntry): Promise<void>;

    /**
     * Remove an index entry by minion ID.
     * Resolves silently if no matching entry exists.
     */
    remove(id: string): Promise<void>;

    /**
     * List index entries with optional filtering, sorting, and pagination.
     *
     * Supports the same {@link StorageFilter} as `StorageAdapter.list()`,
     * applied against the index entry fields.
     */
    list(filter?: StorageFilter): Promise<IndexEntry[]>;

    /**
     * Full-text search across indexed entries.
     *
     * The query is matched against the `searchableText` field.
     * Returns entries where all tokens in the query are found.
     */
    search(query: string): Promise<IndexEntry[]>;

    /**
     * Count entries matching a filter.
     * Useful for pagination UI without fetching the full result set.
     */
    count(filter?: StorageFilter): Promise<number>;

    /**
     * Remove all entries from the index.
     * Used for rebuild / reset scenarios.
     */
    clear(): Promise<void>;
}
