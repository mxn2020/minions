/**
 * @module minions-sdk/index-layer/neon
 * Neon (serverless Postgres) index adapter for the Minions system.
 *
 * Requires the `@neondatabase/serverless` package as an optional peer dependency.
 *
 * Stores index entries in a Postgres table with full-text search via
 * `to_tsvector` / `ts_query`.  Uses the same schema approach as the
 * Supabase index adapter but communicates directly via the Neon client.
 *
 * @example
 * ```typescript
 * import { neon } from '@neondatabase/serverless';
 * import { NeonIndexAdapter } from 'minions-sdk';
 *
 * const sql = neon(process.env.NEON_DATABASE_URL!);
 * const index = new NeonIndexAdapter(sql);
 * const minions = new Minions({ storage, index });
 * ```
 */

import type { StorageFilter } from '../storage/StorageAdapter.js';
import type { IndexAdapter, IndexEntry } from './IndexAdapter.js';

// ─── Neon Client Types ───────────────────────────────────────────────────────
//
// Minimal type interface so the adapter compiles without `@neondatabase/serverless`.

/** Row result from a Neon query. */
type NeonRow = Record<string, unknown>;

/**
 * Minimal interface for a Neon `sql` tagged template function.
 *
 * The `neon()` function from `@neondatabase/serverless` returns a function
 * with this signature.
 */
export interface NeonClientLike {
    (strings: TemplateStringsArray, ...values: unknown[]): Promise<NeonRow[]>;
}

// ─── Configuration ───────────────────────────────────────────────────────────

/** Options for the Neon index adapter. */
export interface NeonIndexOptions {
    /**
     * Name of the Postgres table for the index.
     * Defaults to `"minion_index"`.
     */
    table?: string;
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
 * Index adapter backed by **Neon** (serverless Postgres).
 *
 * Use {@link NeonIndexAdapter.createTableSQL} to get the DDL for creating
 * the index table.
 *
 * @example
 * ```sql
 * CREATE TABLE IF NOT EXISTS minion_index (
 *   id              TEXT PRIMARY KEY,
 *   title           TEXT NOT NULL,
 *   description     TEXT,
 *   minion_type_id  TEXT NOT NULL,
 *   status          TEXT,
 *   priority        TEXT,
 *   tags            TEXT[],
 *   searchable_text TEXT NOT NULL,
 *   created_at      TEXT NOT NULL,
 *   updated_at      TEXT NOT NULL,
 *   deleted_at      TEXT
 * );
 * CREATE INDEX IF NOT EXISTS idx_minion_index_fts
 *   ON minion_index USING gin(to_tsvector('english', searchable_text));
 * ```
 */
export class NeonIndexAdapter implements IndexAdapter {
    private sql: NeonClientLike;
    private table: string;

    constructor(sql: NeonClientLike, options?: NeonIndexOptions) {
        this.sql = sql;
        this.table = options?.table ?? 'minion_index';
    }

    // ── Static helpers ─────────────────────────────────────────────────────

    /**
     * Returns the SQL DDL for creating the index table.
     * Run this in your Neon console or in a migration.
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

    private fromRow(row: NeonRow): IndexEntry {
        const r = row as unknown as IndexRow;
        return {
            id: r.id,
            title: r.title,
            description: r.description ?? undefined,
            minionTypeId: r.minion_type_id,
            status: r.status ?? undefined,
            priority: r.priority ?? undefined,
            tags: r.tags ?? undefined,
            searchableText: r.searchable_text,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            deletedAt: r.deleted_at ?? undefined,
        };
    }

    // ── IndexAdapter implementation ────────────────────────────────────────

    async upsert(entry: IndexEntry): Promise<void> {
        await this.sql`
      INSERT INTO minion_index
        (id, title, description, minion_type_id, status, priority, tags,
         searchable_text, created_at, updated_at, deleted_at)
      VALUES
        (${entry.id}, ${entry.title}, ${entry.description ?? null},
         ${entry.minionTypeId}, ${entry.status ?? null}, ${entry.priority ?? null},
         ${entry.tags ?? null}, ${entry.searchableText},
         ${entry.createdAt}, ${entry.updatedAt}, ${entry.deletedAt ?? null})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        minion_type_id = EXCLUDED.minion_type_id,
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        tags = EXCLUDED.tags,
        searchable_text = EXCLUDED.searchable_text,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at,
        deleted_at = EXCLUDED.deleted_at
    `;
    }

    async remove(id: string): Promise<void> {
        await this.sql`DELETE FROM minion_index WHERE id = ${id}`;
    }

    async list(filter?: StorageFilter): Promise<IndexEntry[]> {
        // We build a simple query here.  For a production adapter you'd want
        // a proper query builder, but tagged template literals keep it safe.
        // Due to the limitations of tagged template SQL, we fetch with basic
        // filters and do advanced filtering client-side.

        const includeDeleted = filter?.includeDeleted ?? false;

        let rows: NeonRow[];

        if (filter?.minionTypeId && filter?.status) {
            if (includeDeleted) {
                rows = await this.sql`
          SELECT * FROM minion_index
          WHERE minion_type_id = ${filter.minionTypeId}
            AND status = ${filter.status}
        `;
            } else {
                rows = await this.sql`
          SELECT * FROM minion_index
          WHERE minion_type_id = ${filter.minionTypeId}
            AND status = ${filter.status}
            AND deleted_at IS NULL
        `;
            }
        } else if (filter?.minionTypeId) {
            if (includeDeleted) {
                rows = await this.sql`
          SELECT * FROM minion_index
          WHERE minion_type_id = ${filter.minionTypeId}
        `;
            } else {
                rows = await this.sql`
          SELECT * FROM minion_index
          WHERE minion_type_id = ${filter.minionTypeId}
            AND deleted_at IS NULL
        `;
            }
        } else if (filter?.status) {
            if (includeDeleted) {
                rows = await this.sql`
          SELECT * FROM minion_index
          WHERE status = ${filter.status}
        `;
            } else {
                rows = await this.sql`
          SELECT * FROM minion_index
          WHERE status = ${filter.status}
            AND deleted_at IS NULL
        `;
            }
        } else {
            if (includeDeleted) {
                rows = await this.sql`SELECT * FROM minion_index`;
            } else {
                rows = await this.sql`
          SELECT * FROM minion_index WHERE deleted_at IS NULL
        `;
            }
        }

        let entries = rows.map((r) => this.fromRow(r));

        // Client-side: tags, sort, pagination
        if (filter?.tags && filter.tags.length > 0) {
            entries = entries.filter((e) =>
                filter.tags!.every((tag) => e.tags?.includes(tag)),
            );
        }

        if (filter?.sortBy) {
            const order = filter.sortOrder === 'desc' ? -1 : 1;
            entries = [...entries].sort((a, b) => {
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

        const offset = filter?.offset ?? 0;
        entries = entries.slice(offset);
        if (filter?.limit !== undefined) {
            entries = entries.slice(0, filter.limit);
        }

        return entries;
    }

    async search(query: string): Promise<IndexEntry[]> {
        if (!query.trim()) return this.list();

        const tokens = query.trim().split(/\s+/).filter(Boolean);
        const tsQuery = tokens.join(' & ');

        try {
            const rows = await this.sql`
        SELECT * FROM minion_index
        WHERE to_tsvector('english', searchable_text) @@ to_tsquery('english', ${tsQuery})
          AND deleted_at IS NULL
      `;
            return rows.map((r) => this.fromRow(r));
        } catch {
            // Fallback to client-side search
            const all = await this.list();
            const lowerTokens = tokens.map((t) => t.toLowerCase());
            return all.filter((e) => {
                const text = e.searchableText.toLowerCase();
                return lowerTokens.every((token) => text.includes(token));
            });
        }
    }

    async count(filter?: StorageFilter): Promise<number> {
        const results = await this.list(filter);
        return results.length;
    }

    async clear(): Promise<void> {
        await this.sql`DELETE FROM minion_index`;
    }
}
