/**
 * @module minions-sdk/storage/withHooks
 * Decorating proxy that wraps a {@link StorageAdapter} with before/after hooks.
 *
 * This is a lightweight alternative to full client-level middleware when you
 * only need to intercept storage operations (get, set, delete, list, search).
 *
 * @example
 * ```typescript
 * import { withHooks, MemoryStorageAdapter } from 'minions-sdk';
 *
 * const storage = withHooks(new MemoryStorageAdapter(), {
 *   beforeSet: async (minion) => {
 *     console.log('Saving:', minion.title);
 *     return minion; // return transformed minion or void to pass through
 *   },
 *   afterGet: async (_id, minion) => {
 *     if (minion) metrics.increment('reads');
 *   },
 * });
 * ```
 */

import type { Minion } from '../types/index.js';
import type { StorageAdapter, StorageFilter } from './StorageAdapter.js';

// ─── Hook Definitions ────────────────────────────────────────────────────────

/**
 * Optional hooks that fire before/after each storage operation.
 *
 * - `before*` hooks run before the underlying adapter method.
 *   - `beforeSet` may return a transformed `Minion` to persist instead.
 * - `after*` hooks run after the underlying adapter method completes.
 */
export interface StorageHooks {
    /** Fires before `adapter.get()`. */
    beforeGet?(id: string): Promise<void>;
    /** Fires after `adapter.get()`. */
    afterGet?(id: string, result: Minion | undefined): Promise<void>;

    /**
     * Fires before `adapter.set()`.
     * Return a `Minion` to replace the value being stored, or `void`/`undefined`
     * to pass through unchanged.
     */
    beforeSet?(minion: Minion): Promise<Minion | void>;
    /** Fires after `adapter.set()`. */
    afterSet?(minion: Minion): Promise<void>;

    /** Fires before `adapter.delete()`. */
    beforeDelete?(id: string): Promise<void>;
    /** Fires after `adapter.delete()`. */
    afterDelete?(id: string): Promise<void>;

    /** Fires before `adapter.list()`. */
    beforeList?(filter?: StorageFilter): Promise<void>;
    /** Fires after `adapter.list()`. */
    afterList?(results: Minion[], filter?: StorageFilter): Promise<void>;

    /** Fires before `adapter.search()`. */
    beforeSearch?(query: string): Promise<void>;
    /** Fires after `adapter.search()`. */
    afterSearch?(results: Minion[], query: string): Promise<void>;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Wrap a {@link StorageAdapter} with before/after hooks.
 *
 * The returned object satisfies the same `StorageAdapter` interface, so it can
 * be used as a drop-in replacement everywhere a storage adapter is expected.
 *
 * @param adapter - The underlying storage adapter to wrap.
 * @param hooks   - An object containing optional before/after hooks.
 * @returns A new `StorageAdapter` that delegates to `adapter` with hooks.
 */
export function withHooks(adapter: StorageAdapter, hooks: StorageHooks): StorageAdapter {
    return {
        async get(id: string): Promise<Minion | undefined> {
            await hooks.beforeGet?.(id);
            const result = await adapter.get(id);
            await hooks.afterGet?.(id, result);
            return result;
        },

        async set(minion: Minion): Promise<void> {
            const transformed = await hooks.beforeSet?.(minion);
            const toStore = transformed ?? minion;
            await adapter.set(toStore);
            await hooks.afterSet?.(toStore);
        },

        async delete(id: string): Promise<void> {
            await hooks.beforeDelete?.(id);
            await adapter.delete(id);
            await hooks.afterDelete?.(id);
        },

        async list(filter?: StorageFilter): Promise<Minion[]> {
            await hooks.beforeList?.(filter);
            const results = await adapter.list(filter);
            await hooks.afterList?.(results, filter);
            return results;
        },

        async search(query: string): Promise<Minion[]> {
            await hooks.beforeSearch?.(query);
            const results = await adapter.search(query);
            await hooks.afterSearch?.(results, query);
            return results;
        },
    };
}
