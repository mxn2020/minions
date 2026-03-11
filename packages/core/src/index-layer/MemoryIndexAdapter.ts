/**
 * @module minions-sdk/index-layer/memory
 * In-memory index adapter — useful for testing and ephemeral workloads.
 */

import type { StorageFilter } from '../storage/StorageAdapter.js';
import { applyFilter } from '../storage/filterUtils.js';
import type { IndexAdapter, IndexEntry } from './IndexAdapter.js';

// ─── Filter helper for IndexEntry ────────────────────────────────────────────

/**
 * Apply a {@link StorageFilter} to an array of {@link IndexEntry}.
 *
 * The shared `applyFilter` from the storage layer works on `Minion` objects.
 * Since `IndexEntry` has the same filter-relevant fields (minionTypeId,
 * status, tags, deletedAt, title, createdAt, updatedAt), we can safely
 * cast and reuse it.
 */
function applyIndexFilter(entries: IndexEntry[], filter?: StorageFilter): IndexEntry[] {
    if (!filter) {
        return entries.filter((e) => !e.deletedAt);
    }
    // applyFilter expects objects with the same shape for the fields it accesses.
    // IndexEntry has all the necessary fields, so this cast is safe.
    return applyFilter(entries as any, filter) as unknown as IndexEntry[];
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

/**
 * Simple in-memory index adapter.
 *
 * All data is stored in a `Map` and is lost when the process exits.
 * This is the default index adapter when no persistence is required and
 * is well suited for unit tests and as a reference implementation.
 */
export class MemoryIndexAdapter implements IndexAdapter {
    private store: Map<string, IndexEntry> = new Map();

    async upsert(entry: IndexEntry): Promise<void> {
        this.store.set(entry.id, { ...entry });
    }

    async remove(id: string): Promise<void> {
        this.store.delete(id);
    }

    async list(filter?: StorageFilter): Promise<IndexEntry[]> {
        const all = Array.from(this.store.values());
        return applyIndexFilter(all, filter);
    }

    async search(query: string): Promise<IndexEntry[]> {
        if (!query.trim()) return this.list();

        const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
        const all = Array.from(this.store.values()).filter((e) => !e.deletedAt);

        return all.filter((e) => {
            const text = e.searchableText.toLowerCase();
            return tokens.every((token) => text.includes(token));
        });
    }

    async count(filter?: StorageFilter): Promise<number> {
        const results = await this.list(filter);
        return results.length;
    }

    async clear(): Promise<void> {
        this.store.clear();
    }
}
