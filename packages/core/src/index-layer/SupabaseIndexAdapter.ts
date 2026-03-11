/**
 * @module minions-sdk/index-layer/supabase
 * Supabase (Postgres) index adapter for the Minions structured object system.
 *
 * Reuses the existing `@supabase/supabase-js` peer dependency.
 *
 * Stores index entries in a dedicated `minion_index` table (separate from the
 * data storage table used by `SupabaseStorageAdapter`).  This allows the index
 * layer to be used independently of the data layer.
 *
 * @example
 * ```typescript
 * import { createClient } from '@supabase/supabase-js';
 * import { SupabaseIndexAdapter } from 'minions-sdk';
 *
 * const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 * const index = new SupabaseIndexAdapter(supabase);
 * const minions = new Minions({ storage, index });
 * ```
 */

import type { StorageFilter } from '../storage/StorageAdapter.js';
import type { SupabaseClientLike } from '../storage/SupabaseStorageAdapter.js';
import type { IndexAdapter, IndexEntry } from './IndexAdapter.js';

// ─── Configuration ───────────────────────────────────────────────────────────

/** Options for the Supabase index adapter. */
export interface SupabaseIndexOptions {
    /**
     * Name of the Postgres table for the index.
     * Defaults to `"minion_index"`.
     */
    table?: string;
}

// ─── Supabase Types (reuse minimal interfaces) ──────────────────────────────

/** Response shape returned by Supabase query builders. */
interface SupabaseResponse<T> {
    data: T | null;
    error: { message: string; code?: string } | null;
}

/** Minimal Supabase filter builder chain. */
interface SupabaseFilterBuilder {
    eq(column: string, value: unknown): SupabaseFilterBuilder;
    is(column: string, value: null): SupabaseFilterBuilder;
    textSearch(column: string, query: string, options?: Record<string, unknown>): SupabaseFilterBuilder;
    order(column: string, options?: { ascending?: boolean }): SupabaseFilterBuilder;
    range(from: number, to: number): SupabaseFilterBuilder;
    limit(count: number): SupabaseFilterBuilder;
    single(): SupabaseFilterBuilder;
    maybeSingle(): SupabaseFilterBuilder;
    then<TResult>(
        onfulfilled?: (value: SupabaseResponse<unknown>) => TResult,
        onrejected?: (reason: unknown) => TResult,
    ): Promise<TResult>;
    [Symbol.toStringTag]?: string;
}

// ─── Row type ────────────────────────────────────────────────────────────────

interface IndexRow {
    id: string;
    title: string;
    description: string | null;
    minion_type_id: string;
    status: string | null;
    priority: string | null;
    tags: string[] | null;
    searchable_text: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

/**
 * Index adapter backed by **Supabase** (Postgres).
 *
 * Use {@link SupabaseIndexAdapter.createTableSQL} to get the DDL for
 * creating the index table.
 *
 * This table is separate from the `minions` data table used by
 * `SupabaseStorageAdapter`, so you can mix and match:
 * - Supabase storage + Supabase index
 * - File storage + Supabase index
 * - Convex storage + Supabase index
 */
export class SupabaseIndexAdapter implements IndexAdapter {
    private client: SupabaseClientLike;
    private table: string;

    constructor(client: SupabaseClientLike, options?: SupabaseIndexOptions) {
        this.client = client;
        this.table = options?.table ?? 'minion_index';
    }

    // ── Static helpers ─────────────────────────────────────────────────────

    /**
     * Returns the SQL DDL for creating the index table.
     * Run this in your Supabase SQL editor or in a migration.
     */
    static createTableSQL(table = 'minion_index'): string {
        return `
CREATE TABLE IF NOT EXISTS ${table} (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  minion_type_id  TEXT NOT NULL,
  status          TEXT,
  priority        TEXT,
  tags            TEXT[],
  searchable_text TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  deleted_at      TEXT
);

CREATE INDEX IF NOT EXISTS idx_${table}_type   ON ${table} (minion_type_id);
CREATE INDEX IF NOT EXISTS idx_${table}_status ON ${table} (status);
CREATE INDEX IF NOT EXISTS idx_${table}_fts
  ON ${table} USING gin(to_tsvector('english', searchable_text));
`.trim();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private toRow(entry: IndexEntry): Record<string, unknown> {
        return {
            id: entry.id,
            title: entry.title,
            description: entry.description ?? null,
            minion_type_id: entry.minionTypeId,
            status: entry.status ?? null,
            priority: entry.priority ?? null,
            tags: entry.tags ?? null,
            searchable_text: entry.searchableText,
            created_at: entry.createdAt,
            updated_at: entry.updatedAt,
            deleted_at: entry.deletedAt ?? null,
        };
    }

    private fromRow(row: IndexRow): IndexEntry {
        return {
            id: row.id,
            title: row.title,
            description: row.description ?? undefined,
            minionTypeId: row.minion_type_id,
            status: row.status ?? undefined,
            priority: row.priority ?? undefined,
            tags: row.tags ?? undefined,
            searchableText: row.searchable_text,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at ?? undefined,
        };
    }

    private throwIfError(response: SupabaseResponse<unknown>): void {
        if (response.error) {
            throw new Error(`Supabase index error: ${response.error.message}`);
        }
    }

    // ── IndexAdapter implementation ────────────────────────────────────────

    async upsert(entry: IndexEntry): Promise<void> {
        const row = this.toRow(entry);
        const response = (await this.client
            .from(this.table)
            .upsert(row, { onConflict: 'id' })) as unknown as SupabaseResponse<unknown>;

        this.throwIfError(response);
    }

    async remove(id: string): Promise<void> {
        const response = (await this.client
            .from(this.table)
            .delete()
            .eq('id', id)) as unknown as SupabaseResponse<unknown>;

        this.throwIfError(response);
    }

    async list(filter?: StorageFilter): Promise<IndexEntry[]> {
        let query = this.client.from(this.table).select('*') as unknown as SupabaseFilterBuilder;

        const includeDeleted = filter?.includeDeleted ?? false;
        if (!includeDeleted) {
            query = query.is('deleted_at', null);
        }

        if (filter?.minionTypeId !== undefined) {
            query = query.eq('minion_type_id', filter.minionTypeId);
        }

        if (filter?.status !== undefined) {
            query = query.eq('status', filter.status);
        }

        // Sorting
        if (filter?.sortBy) {
            const columnMap: Record<string, string> = {
                createdAt: 'created_at',
                updatedAt: 'updated_at',
                title: 'title',
            };
            const column = columnMap[filter.sortBy] ?? 'created_at';
            query = query.order(column, { ascending: filter.sortOrder !== 'desc' });
        }

        // Pagination (only when no client-side tag filtering needed)
        const needsClientFilter = filter?.tags && filter.tags.length > 0;
        if (!needsClientFilter && filter?.offset !== undefined && filter?.limit !== undefined) {
            query = query.range(filter.offset, filter.offset + filter.limit - 1);
        } else if (!needsClientFilter && filter?.offset !== undefined) {
            query = query.range(filter.offset, Number.MAX_SAFE_INTEGER);
        } else if (!needsClientFilter && filter?.limit !== undefined) {
            query = query.limit(filter.limit);
        }

        const response = (await query) as unknown as SupabaseResponse<IndexRow[]>;
        this.throwIfError(response);

        let entries = (response.data ?? []).map((r) => this.fromRow(r));

        // Client-side tag filtering
        if (needsClientFilter && filter?.tags) {
            entries = entries.filter((e) =>
                filter.tags!.every((tag) => e.tags?.includes(tag)),
            );

            // Apply pagination after tag filtering
            const offset = filter.offset ?? 0;
            entries = entries.slice(offset);
            if (filter.limit !== undefined) {
                entries = entries.slice(0, filter.limit);
            }
        }

        return entries;
    }

    async search(query: string): Promise<IndexEntry[]> {
        if (!query.trim()) return this.list();

        const tokens = query.trim().split(/\s+/).filter(Boolean);
        const tsQuery = tokens.join(' & ');

        try {
            const q = (this.client
                .from(this.table)
                .select('*') as unknown as SupabaseFilterBuilder)
                .is('deleted_at', null)
                .textSearch('searchable_text', tsQuery);

            const response = (await q) as unknown as SupabaseResponse<IndexRow[]>;

            if (!response.error && response.data) {
                return response.data.map((r) => this.fromRow(r));
            }
        } catch {
            // Full-text search not available — fall back to client-side
        }

        // Fallback
        const all = await this.list();
        const lowerTokens = tokens.map((t) => t.toLowerCase());
        return all.filter((e) => {
            const text = e.searchableText.toLowerCase();
            return lowerTokens.every((token) => text.includes(token));
        });
    }

    async count(filter?: StorageFilter): Promise<number> {
        // For simplicity, reuse list and count results
        const results = await this.list(filter);
        return results.length;
    }

    async clear(): Promise<void> {
        // Supabase doesn't support DELETE without a filter, so we use a
        // filter that matches everything
        const response = (await this.client
            .from(this.table)
            .delete()
            .neq('id', '__impossible_id__')) as unknown as SupabaseResponse<unknown>;

        this.throwIfError(response);
    }
}
