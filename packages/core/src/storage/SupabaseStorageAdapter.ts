/**
 * @module minions-sdk/storage/supabase
 * Supabase (Postgres) storage adapter for the Minions structured object system.
 *
 * Requires the `@supabase/supabase-js` package as a peer dependency.
 *
 * @example
 * ```typescript
 * import { createClient } from '@supabase/supabase-js';
 * import { SupabaseStorageAdapter } from 'minions-sdk';
 *
 * const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 * const storage = new SupabaseStorageAdapter(supabase);
 *
 * const minions = new Minions({ storage });
 * ```
 */

import type { Minion } from '../types/index.js';
import type { StorageAdapter, StorageFilter } from './StorageAdapter.js';
import { applyFilter } from './filterUtils.js';

// ─── Supabase Client Types ──────────────────────────────────────────────────
//
// Minimal type interfaces so the adapter compiles without `@supabase/supabase-js`
// installed (it is an optional peer dependency).

/** Response shape returned by Supabase query builders. */
interface SupabaseResponse<T> {
    data: T | null;
    error: { message: string; code?: string } | null;
}

/** Minimal Supabase query builder chain. */
interface SupabaseQueryBuilder {
    select(columns?: string): SupabaseFilterBuilder;
    insert(values: Record<string, unknown> | Record<string, unknown>[], options?: Record<string, unknown>): SupabaseFilterBuilder;
    update(values: Record<string, unknown>): SupabaseFilterBuilder;
    upsert(values: Record<string, unknown> | Record<string, unknown>[], options?: Record<string, unknown>): SupabaseFilterBuilder;
    delete(): SupabaseFilterBuilder;
}

/** Minimal Supabase filter builder chain. */
interface SupabaseFilterBuilder {
    eq(column: string, value: unknown): SupabaseFilterBuilder;
    neq(column: string, value: unknown): SupabaseFilterBuilder;
    is(column: string, value: null): SupabaseFilterBuilder;
    not(column: string, operator: string, value: unknown): SupabaseFilterBuilder;
    contains(column: string, value: unknown): SupabaseFilterBuilder;
    textSearch(column: string, query: string, options?: Record<string, unknown>): SupabaseFilterBuilder;
    ilike(column: string, pattern: string): SupabaseFilterBuilder;
    order(column: string, options?: { ascending?: boolean }): SupabaseFilterBuilder;
    range(from: number, to: number): SupabaseFilterBuilder;
    limit(count: number): SupabaseFilterBuilder;
    single(): SupabaseFilterBuilder;
    maybeSingle(): SupabaseFilterBuilder;
    then<TResult>(
        onfulfilled?: (value: SupabaseResponse<unknown>) => TResult,
        onrejected?: (reason: unknown) => TResult,
    ): Promise<TResult>;
    // Allow awaiting directly
    [Symbol.toStringTag]?: string;
}

/**
 * Minimal interface for a Supabase client.
 *
 * Any object that exposes a `from(table)` method returning a query builder
 * matching the `@supabase/supabase-js` contract will work.
 */
export interface SupabaseClientLike {
    from(table: string): SupabaseQueryBuilder;
}

// ─── Configuration ───────────────────────────────────────────────────────────

/** Options for the Supabase storage adapter. */
export interface SupabaseStorageOptions {
    /**
     * Name of the Postgres table that stores minions.
     * Defaults to `"minions"`.
     */
    table?: string;
}

// ─── Row type ────────────────────────────────────────────────────────────────

/**
 * Shape of a row in the `minions` Postgres table.
 *
 * The minion is stored as a JSONB column (`data`) alongside a few
 * denormalized columns used for server-side filtering.
 */
interface MinionRow {
    /** Minion UUID — primary key. */
    id: string;
    /** Serialized Minion JSON. */
    data: Minion;
    /** Denormalized: minionTypeId for server-side filtering. */
    minion_type_id: string;
    /** Denormalized: status for server-side filtering. */
    status: string | null;
    /** Denormalized: deletedAt for server-side filtering. */
    deleted_at: string | null;
    /** Denormalized: searchable text for full-text search. */
    searchable_text: string | null;
    /** Denormalized: tags array for filtering. */
    tags: string[] | null;
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

/**
 * Storage adapter backed by **Supabase** (Postgres).
 *
 * Minions are stored in a single Postgres table with a JSONB `data` column
 * containing the full `Minion` object, plus a few denormalized columns
 * (`minion_type_id`, `status`, `deleted_at`, `searchable_text`, `tags`)
 * for efficient server-side filtering.
 *
 * Use {@link SupabaseStorageAdapter.createTableSQL} to get the DDL for
 * creating the table.
 *
 * @example
 * ```sql
 * -- Run this in your Supabase SQL editor:
 * CREATE TABLE IF NOT EXISTS minions (
 *   id             TEXT PRIMARY KEY,
 *   data           JSONB NOT NULL,
 *   minion_type_id TEXT NOT NULL,
 *   status         TEXT,
 *   deleted_at     TEXT,
 *   searchable_text TEXT,
 *   tags           TEXT[],
 *   created_at     TIMESTAMPTZ DEFAULT now(),
 *   updated_at     TIMESTAMPTZ DEFAULT now()
 * );
 *
 * -- Optional: full-text search index
 * CREATE INDEX IF NOT EXISTS idx_minions_searchable
 *   ON minions USING gin(to_tsvector('english', coalesce(searchable_text, '')));
 * ```
 */
export class SupabaseStorageAdapter implements StorageAdapter {
    private client: SupabaseClientLike;
    private table: string;

    constructor(client: SupabaseClientLike, options?: SupabaseStorageOptions) {
        this.client = client;
        this.table = options?.table ?? 'minions';
    }

    // ── Static helpers ───────────────────────────────────────────────────

    /**
     * Returns the SQL DDL statement for creating the minions table.
     * Run this in your Supabase SQL editor or in a migration.
     */
    static createTableSQL(table = 'minions'): string {
        return `
CREATE TABLE IF NOT EXISTS ${table} (
  id              TEXT PRIMARY KEY,
  data            JSONB NOT NULL,
  minion_type_id  TEXT NOT NULL,
  status          TEXT,
  deleted_at      TEXT,
  searchable_text TEXT,
  tags            TEXT[],
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Full-text search index (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_${table}_searchable
  ON ${table} USING gin(to_tsvector('english', coalesce(searchable_text, '')));

-- Index for common query patterns
CREATE INDEX IF NOT EXISTS idx_${table}_type   ON ${table} (minion_type_id);
CREATE INDEX IF NOT EXISTS idx_${table}_status ON ${table} (status);
`.trim();
    }

    // ── Private helpers ──────────────────────────────────────────────────

    /** Convert a Minion to a table row. */
    private toRow(minion: Minion): Record<string, unknown> {
        return {
            id: minion.id,
            data: minion,
            minion_type_id: minion.minionTypeId,
            status: minion.status ?? null,
            deleted_at: minion.deletedAt ?? null,
            searchable_text: minion.searchableText ?? minion.title,
            tags: minion.tags ?? null,
        };
    }

    /** Convert a table row back to a Minion. */
    private fromRow(row: MinionRow): Minion {
        // The `data` column is stored as JSONB so Supabase returns it
        // already parsed as an object.
        return (typeof row.data === 'string' ? JSON.parse(row.data) : row.data) as Minion;
    }

    /** Throw if the Supabase response contains an error. */
    private throwIfError(response: SupabaseResponse<unknown>): void {
        if (response.error) {
            throw new Error(`Supabase error: ${response.error.message}`);
        }
    }

    // ── StorageAdapter implementation ────────────────────────────────────

    async get(id: string): Promise<Minion | undefined> {
        const response = (await this.client
            .from(this.table)
            .select('data')
            .eq('id', id)
            .maybeSingle()) as unknown as SupabaseResponse<{ data: Minion } | null>;

        this.throwIfError(response);

        if (!response.data) return undefined;
        return this.fromRow(response.data as unknown as MinionRow);
    }

    async set(minion: Minion): Promise<void> {
        const row = this.toRow(minion);
        const response = (await this.client
            .from(this.table)
            .upsert(row, { onConflict: 'id' })) as unknown as SupabaseResponse<unknown>;

        this.throwIfError(response);
    }

    async delete(id: string): Promise<void> {
        const response = (await this.client
            .from(this.table)
            .delete()
            .eq('id', id)) as unknown as SupabaseResponse<unknown>;

        this.throwIfError(response);
    }

    async list(filter?: StorageFilter): Promise<Minion[]> {
        let query = this.client.from(this.table).select('data');

        // ── Server-side filtering ────────────────────────────────────────
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

        // Sorting (server-side)
        if (filter?.sortBy) {
            const columnMap: Record<string, string> = {
                createdAt: 'created_at',
                updatedAt: 'updated_at',
                title: 'id', // fallback; title lives inside JSONB
            };
            const column = columnMap[filter.sortBy] ?? 'created_at';

            // For title sorting we fall back to client-side via applyFilter
            if (filter.sortBy !== 'title') {
                query = query.order(column, { ascending: filter.sortOrder !== 'desc' });
            }
        }

        // Pagination (server-side) — only when we don't need client-side tag/title filtering
        const needsClientFilter = (filter?.tags && filter.tags.length > 0) || filter?.sortBy === 'title';
        if (!needsClientFilter && filter?.offset !== undefined && filter?.limit !== undefined) {
            query = query.range(filter.offset, filter.offset + filter.limit - 1);
        } else if (!needsClientFilter && filter?.limit !== undefined) {
            query = query.limit(filter.limit);
        }

        const response = (await query) as unknown as SupabaseResponse<Array<{ data: Minion }>>;
        this.throwIfError(response);

        const rows = response.data ?? [];
        let minions = rows.map((r) => this.fromRow(r as unknown as MinionRow));

        // Apply any filters that couldn't be pushed to the server
        if (needsClientFilter && filter) {
            minions = applyFilter(minions, filter);
        }

        return minions;
    }

    async search(query: string): Promise<Minion[]> {
        if (!query.trim()) return this.list();

        // Try server-side full-text search first
        let response: SupabaseResponse<Array<{ data: Minion }>>;

        try {
            // Supabase textSearch uses Postgres ts_query syntax.
            // We join tokens with ' & ' for an AND search.
            const tsQuery = query
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .join(' & ');

            const q = this.client
                .from(this.table)
                .select('data')
                .is('deleted_at', null)
                .textSearch('searchable_text', tsQuery);

            response = (await q) as unknown as SupabaseResponse<Array<{ data: Minion }>>;

            if (!response.error && response.data) {
                return response.data.map((r) => this.fromRow(r as unknown as MinionRow));
            }
        } catch {
            // Full-text search not available — fall back to client-side
        }

        // Fallback: client-side token matching (same logic as MemoryStorageAdapter)
        const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
        const all = await this.list();

        return all.filter((m) => {
            const text = (m.searchableText ?? m.title).toLowerCase();
            return tokens.every((token) => text.includes(token));
        });
    }
}
