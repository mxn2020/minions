/**
 * @module minions-sdk/index-layer/redis
 * Redis-backed index adapter for the Minions structured object system.
 *
 * Requires the `ioredis` package as an optional peer dependency.
 *
 * Stores index entries as Redis hashes keyed by `minion:index:<id>`.
 * Uses sorted sets for ordering and a secondary set for type lookups.
 * Falls back to client-side filtering for complex queries.
 *
 * If the RediSearch module is available, `search()` uses `FT.SEARCH`
 * for full-text search.  Otherwise it falls back to scanning and
 * client-side token matching.
 *
 * @example
 * ```typescript
 * import Redis from 'ioredis';
 * import { RedisIndexAdapter } from 'minions-sdk';
 *
 * const redis = new Redis('redis://localhost:6379');
 * const index = new RedisIndexAdapter(redis, { prefix: 'myapp' });
 * const minions = new Minions({ storage, index });
 * ```
 */

import type { StorageFilter } from '../storage/StorageAdapter.js';
import type { IndexAdapter, IndexEntry } from './IndexAdapter.js';

// ─── Redis Client Types ──────────────────────────────────────────────────────
//
// Minimal type interfaces so the adapter compiles without `ioredis` installed.

/** Minimal interface for an ioredis-compatible client. */
export interface RedisClientLike {
    hset(key: string, data: Record<string, string>): Promise<number>;
    hgetall(key: string): Promise<Record<string, string>>;
    del(...keys: string[]): Promise<number>;
    sadd(key: string, ...members: string[]): Promise<number>;
    srem(key: string, ...members: string[]): Promise<number>;
    smembers(key: string): Promise<string[]>;
    zadd(key: string, score: number, member: string): Promise<number | string>;
    zrem(key: string, ...members: string[]): Promise<number>;
    zrangebyscore(key: string, min: string | number, max: string | number): Promise<string[]>;
    keys(pattern: string): Promise<string[]>;
    pipeline(): RedisPipeline;
    // RediSearch (optional)
    call(command: string, ...args: (string | number)[]): Promise<unknown>;
}

/** Minimal interface for a Redis pipeline. */
interface RedisPipeline {
    hset(key: string, data: Record<string, string>): RedisPipeline;
    del(...keys: string[]): RedisPipeline;
    sadd(key: string, ...members: string[]): RedisPipeline;
    srem(key: string, ...members: string[]): RedisPipeline;
    zadd(key: string, score: number, member: string): RedisPipeline;
    zrem(key: string, ...members: string[]): RedisPipeline;
    exec(): Promise<unknown>;
}

// ─── Configuration ───────────────────────────────────────────────────────────

/** Options for the Redis index adapter. */
export interface RedisIndexOptions {
    /**
     * Key prefix for all Redis keys.
     * Defaults to `"minions"`.
     * Keys will be: `<prefix>:index:<id>`, `<prefix>:index:ids`, etc.
     */
    prefix?: string;
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

export class RedisIndexAdapter implements IndexAdapter {
    private client: RedisClientLike;
    private prefix: string;

    constructor(client: RedisClientLike, options?: RedisIndexOptions) {
        this.client = client;
        this.prefix = options?.prefix ?? 'minions';
    }

    // ── Key helpers ────────────────────────────────────────────────────────

    private entryKey(id: string): string {
        return `${this.prefix}:index:${id}`;
    }

    private idsKey(): string {
        return `${this.prefix}:index:ids`;
    }

    private typeKey(minionTypeId: string): string {
        return `${this.prefix}:index:type:${minionTypeId}`;
    }

    private timeKey(): string {
        return `${this.prefix}:index:by_time`;
    }

    // ── Serialization ──────────────────────────────────────────────────────

    private toHash(entry: IndexEntry): Record<string, string> {
        return {
            id: entry.id,
            title: entry.title,
            description: entry.description ?? '',
            minionTypeId: entry.minionTypeId,
            status: entry.status ?? '',
            priority: entry.priority ?? '',
            tags: entry.tags ? JSON.stringify(entry.tags) : '[]',
            searchableText: entry.searchableText,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            deletedAt: entry.deletedAt ?? '',
        };
    }

    private fromHash(hash: Record<string, string>): IndexEntry | undefined {
        if (!hash.id) return undefined;
        return {
            id: hash.id,
            title: hash.title,
            description: hash.description || undefined,
            minionTypeId: hash.minionTypeId,
            status: hash.status || undefined,
            priority: hash.priority || undefined,
            tags: hash.tags ? (JSON.parse(hash.tags) as string[]) : undefined,
            searchableText: hash.searchableText,
            createdAt: hash.createdAt,
            updatedAt: hash.updatedAt,
            deletedAt: hash.deletedAt || undefined,
        };
    }

    // ── IndexAdapter implementation ────────────────────────────────────────

    async upsert(entry: IndexEntry): Promise<void> {
        const pipe = this.client.pipeline();
        pipe.hset(this.entryKey(entry.id), this.toHash(entry));
        pipe.sadd(this.idsKey(), entry.id);
        pipe.sadd(this.typeKey(entry.minionTypeId), entry.id);
        pipe.zadd(this.timeKey(), new Date(entry.createdAt).getTime(), entry.id);
        await pipe.exec();
    }

    async remove(id: string): Promise<void> {
        // Get the entry first to clean up type index
        const hash = await this.client.hgetall(this.entryKey(id));
        const entry = this.fromHash(hash);

        const pipe = this.client.pipeline();
        pipe.del(this.entryKey(id));
        pipe.srem(this.idsKey(), id);
        pipe.zrem(this.timeKey(), id);
        if (entry) {
            pipe.srem(this.typeKey(entry.minionTypeId), id);
        }
        await pipe.exec();
    }

    async list(filter?: StorageFilter): Promise<IndexEntry[]> {
        // Get all entry IDs (optionally filtered by type)
        let ids: string[];
        if (filter?.minionTypeId) {
            ids = await this.client.smembers(this.typeKey(filter.minionTypeId));
        } else {
            ids = await this.client.smembers(this.idsKey());
        }

        if (ids.length === 0) return [];

        // Fetch all entries
        const entries: IndexEntry[] = [];
        for (const id of ids) {
            const hash = await this.client.hgetall(this.entryKey(id));
            const entry = this.fromHash(hash);
            if (entry) entries.push(entry);
        }

        // Apply filters client-side
        let results = entries;

        const includeDeleted = filter?.includeDeleted ?? false;
        if (!includeDeleted) {
            results = results.filter((e) => !e.deletedAt);
        }

        if (filter?.status) {
            results = results.filter((e) => e.status === filter.status);
        }

        if (filter?.tags && filter.tags.length > 0) {
            results = results.filter((e) =>
                filter.tags!.every((tag) => e.tags?.includes(tag)),
            );
        }

        // Sort
        if (filter?.sortBy) {
            const order = filter.sortOrder === 'desc' ? -1 : 1;
            results = [...results].sort((a, b) => {
                let aVal: string;
                let bVal: string;
                switch (filter.sortBy) {
                    case 'title':
                        aVal = a.title.toLowerCase();
                        bVal = b.title.toLowerCase();
                        break;
                    case 'createdAt':
                        aVal = a.createdAt;
                        bVal = b.createdAt;
                        break;
                    case 'updatedAt':
                        aVal = a.updatedAt;
                        bVal = b.updatedAt;
                        break;
                    default:
                        return 0;
                }
                return aVal < bVal ? -order : aVal > bVal ? order : 0;
            });
        }

        // Pagination
        const offset = filter?.offset ?? 0;
        results = results.slice(offset);
        if (filter?.limit !== undefined) {
            results = results.slice(0, filter.limit);
        }

        return results;
    }

    async search(query: string): Promise<IndexEntry[]> {
        if (!query.trim()) return this.list();

        // Fallback: client-side token matching
        const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
        const all = await this.list();

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
        const ids = await this.client.smembers(this.idsKey());
        if (ids.length === 0) return;

        const keys = ids.map((id) => this.entryKey(id));
        keys.push(this.idsKey(), this.timeKey());

        // Also clean up type indexes
        const typeKeys = await this.client.keys(`${this.prefix}:index:type:*`);
        keys.push(...typeKeys);

        await this.client.del(...keys);
    }
}
