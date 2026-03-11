/**
 * @module minions-sdk/index-layer/sqlite
 * SQLite-backed index adapter using `sql.js` (official SQLite compiled to WASM).
 *
 * Uses `sql.js` as an optional peer dependency. Unlike native addons, sql.js
 * works everywhere — Node.js, Deno, Bun, and browsers — with zero compilation.
 *
 * **Important:** Use the async factory `SqliteIndexAdapter.create()` instead
 * of calling the constructor directly — the WASM module must be loaded first.
 *
 * @example
 * ```typescript
 * import { SqliteIndexAdapter } from 'minions-sdk/node';
 *
 * const index = await SqliteIndexAdapter.create('./data/minions.index.db');
 * const minions = new Minions({ storage, index });
 * ```
 */

import type { StorageFilter } from '../storage/StorageAdapter.js';
import type { IndexAdapter, IndexEntry } from './IndexAdapter.js';

// ─── sql.js minimal types ────────────────────────────────────────────────────

interface SqlJsDatabase {
    run(sql: string, params?: Record<string, unknown>): void;
    exec(sql: string, params?: Record<string, unknown>): Array<{ columns: string[]; values: unknown[][] }>;
    close(): void;
    export(): Uint8Array;
}

interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => SqlJsDatabase;
}

type InitSqlJsFn = (config?: Record<string, unknown>) => Promise<SqlJsStatic>;

// ─── Row type ────────────────────────────────────────────────────────────────

interface IndexRow {
    id: string;
    title: string;
    description: string | null;
    minion_type_id: string;
    status: string | null;
    priority: string | null;
    tags: string | null; // JSON array
    searchable_text: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

// Column order matching the SELECT * from minion_index
const COLUMNS = [
    'id', 'title', 'description', 'minion_type_id', 'status', 'priority',
    'tags', 'searchable_text', 'created_at', 'updated_at', 'deleted_at',
] as const;

// ─── Adapter ─────────────────────────────────────────────────────────────────

/**
 * SQLite-backed index adapter using the official SQLite (via sql.js WASM).
 *
 * Always use the async factory method:
 * ```ts
 * const adapter = await SqliteIndexAdapter.create(':memory:');
 * ```
 */
export class SqliteIndexAdapter implements IndexAdapter {
    private db: SqlJsDatabase;
    private dbPath: string | null;
    private hasFts = false;

    private constructor(db: SqlJsDatabase, dbPath: string | null) {
        this.db = db;
        this.dbPath = dbPath;
        this.initTables();
    }

    /**
     * Create a new SQLite index adapter.
     *
     * @param dbPath - Path to the SQLite database file, or `:memory:` for
     *   in-memory mode. When a file path is given, the database is loaded from
     *   disk (if it exists) and persisted back on every write.
     */
    static async create(dbPath: string = ':memory:'): Promise<SqliteIndexAdapter> {
        let initSqlJs: InitSqlJsFn;
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const mod = require('sql.js');
            initSqlJs = (typeof mod === 'function' ? mod : (mod as Record<string, unknown>).default) as InitSqlJsFn;
        } catch {
            throw new Error(
                'SqliteIndexAdapter requires the "sql.js" package. ' +
                'Install it with: npm install sql.js',
            );
        }

        const SQL = await initSqlJs();

        let db: SqlJsDatabase;
        if (dbPath !== ':memory:') {
            try {
                const { readFileSync } = require('node:fs') as typeof import('node:fs');
                const data = readFileSync(dbPath);
                db = new SQL.Database(new Uint8Array(data));
            } catch {
                db = new SQL.Database();
            }
        } else {
            db = new SQL.Database();
        }

        return new SqliteIndexAdapter(db, dbPath === ':memory:' ? null : dbPath);
    }

    private initTables(): void {
        this.db.run(`
      CREATE TABLE IF NOT EXISTS minion_index (
        id              TEXT PRIMARY KEY,
        title           TEXT NOT NULL,
        description     TEXT,
        minion_type_id  TEXT NOT NULL,
        status          TEXT,
        priority        TEXT,
        tags            TEXT,
        searchable_text TEXT NOT NULL,
        created_at      TEXT NOT NULL,
        updated_at      TEXT NOT NULL,
        deleted_at      TEXT
      )
    `);

        this.db.run('CREATE INDEX IF NOT EXISTS idx_minion_index_type   ON minion_index (minion_type_id)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_minion_index_status ON minion_index (status)');

        // Try to create FTS5 virtual table — may not be available in all builds
        try {
            this.db.run(`
        CREATE VIRTUAL TABLE IF NOT EXISTS minion_index_fts USING fts5(
          id UNINDEXED,
          searchable_text,
          content='minion_index',
          content_rowid='rowid'
        )
      `);

            // Sync triggers
            this.db.run(`
        CREATE TRIGGER IF NOT EXISTS minion_index_ai AFTER INSERT ON minion_index BEGIN
          INSERT INTO minion_index_fts(rowid, id, searchable_text)
          VALUES (new.rowid, new.id, new.searchable_text);
        END
      `);

            this.db.run(`
        CREATE TRIGGER IF NOT EXISTS minion_index_ad AFTER DELETE ON minion_index BEGIN
          INSERT INTO minion_index_fts(minion_index_fts, rowid, id, searchable_text)
          VALUES ('delete', old.rowid, old.id, old.searchable_text);
        END
      `);

            this.db.run(`
        CREATE TRIGGER IF NOT EXISTS minion_index_au AFTER UPDATE ON minion_index BEGIN
          INSERT INTO minion_index_fts(minion_index_fts, rowid, id, searchable_text)
          VALUES ('delete', old.rowid, old.id, old.searchable_text);
          INSERT INTO minion_index_fts(rowid, id, searchable_text)
          VALUES (new.rowid, new.id, new.searchable_text);
        END
      `);

            this.hasFts = true;
        } catch {
            // FTS5 not available — fall back to LIKE-based search
            this.hasFts = false;
        }
    }

    // ── Persistence ─────────────────────────────────────────────────────────

    private persist(): void {
        if (!this.dbPath) return;
        try {
            const { writeFileSync, mkdirSync } = require('node:fs') as typeof import('node:fs');
            const { dirname } = require('node:path') as typeof import('node:path');
            mkdirSync(dirname(this.dbPath), { recursive: true });
            writeFileSync(this.dbPath, this.db.export());
        } catch {
            // Persistence failure is non-fatal for in-memory usage
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private rowsToEntries(result: Array<{ columns: string[]; values: unknown[][] }>): IndexEntry[] {
        if (!result.length || !result[0].values.length) return [];
        const { columns, values } = result[0];
        return values.map((row) => {
            const obj: Record<string, unknown> = {};
            columns.forEach((col, i) => { obj[col] = row[i]; });
            return this.fromRow(obj as unknown as IndexRow);
        });
    }

    private fromRow(row: IndexRow): IndexEntry {
        return {
            id: row.id,
            title: row.title,
            description: row.description ?? undefined,
            minionTypeId: row.minion_type_id,
            status: row.status ?? undefined,
            priority: row.priority ?? undefined,
            tags: row.tags ? (JSON.parse(row.tags) as string[]) : undefined,
            searchableText: row.searchable_text,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at ?? undefined,
        };
    }

    // ── IndexAdapter implementation ──────────────────────────────────────────

    async upsert(entry: IndexEntry): Promise<void> {
        // sql.js uses $name for named parameters
        this.db.run(`
      INSERT OR REPLACE INTO minion_index
        (id, title, description, minion_type_id, status, priority, tags,
         searchable_text, created_at, updated_at, deleted_at)
      VALUES
        ($id, $title, $description, $minion_type_id, $status, $priority, $tags,
         $searchable_text, $created_at, $updated_at, $deleted_at)
    `, {
            $id: entry.id,
            $title: entry.title,
            $description: entry.description ?? null,
            $minion_type_id: entry.minionTypeId,
            $status: entry.status ?? null,
            $priority: entry.priority ?? null,
            $tags: entry.tags ? JSON.stringify(entry.tags) : null,
            $searchable_text: entry.searchableText,
            $created_at: entry.createdAt,
            $updated_at: entry.updatedAt,
            $deleted_at: entry.deletedAt ?? null,
        });
        this.persist();
    }

    async remove(id: string): Promise<void> {
        this.db.run('DELETE FROM minion_index WHERE id = $id', { $id: id });
        this.persist();
    }

    async list(filter?: StorageFilter): Promise<IndexEntry[]> {
        const conditions: string[] = [];
        const params: Record<string, unknown> = {};

        // ── Build WHERE clause ──────────────────────────────────────────

        const includeDeleted = filter?.includeDeleted ?? false;
        if (!includeDeleted) {
            conditions.push('deleted_at IS NULL');
        }

        if (filter?.minionTypeId !== undefined) {
            conditions.push('minion_type_id = $minionTypeId');
            params.$minionTypeId = filter.minionTypeId;
        }

        if (filter?.status !== undefined) {
            conditions.push('status = $status');
            params.$status = filter.status;
        }

        const where = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        // ── Sorting ─────────────────────────────────────────────────────

        let orderBy = '';
        if (filter?.sortBy) {
            const columnMap: Record<string, string> = {
                createdAt: 'created_at',
                updatedAt: 'updated_at',
                title: 'title',
            };
            const column = columnMap[filter.sortBy] ?? 'created_at';
            const direction = filter.sortOrder === 'desc' ? 'DESC' : 'ASC';
            orderBy = `ORDER BY ${column} COLLATE NOCASE ${direction}`;
        }

        // ── Pagination ──────────────────────────────────────────────────

        let limitOffset = '';
        if (filter?.limit !== undefined) {
            limitOffset = `LIMIT $limit`;
            params.$limit = filter.limit;
        }
        if (filter?.offset !== undefined) {
            if (!limitOffset) {
                limitOffset = 'LIMIT -1'; // SQLite requires LIMIT before OFFSET
            }
            limitOffset += ` OFFSET $offset`;
            params.$offset = filter.offset;
        }

        const sql = `SELECT * FROM minion_index ${where} ${orderBy} ${limitOffset}`;
        const result = this.db.exec(sql, params);
        let entries = this.rowsToEntries(result);

        // ── Client-side tag filtering (tags stored as JSON) ─────────────
        if (filter?.tags && filter.tags.length > 0) {
            entries = entries.filter((e) =>
                filter.tags!.every((tag) => e.tags?.includes(tag)),
            );
        }

        return entries;
    }

    async search(query: string): Promise<IndexEntry[]> {
        if (!query.trim()) return this.list();

        const tokens = query.trim().split(/\s+/).filter(Boolean);

        // Try FTS5 search first
        if (this.hasFts) {
            try {
                const ftsQuery = tokens.map((t) => `"${t.replace(/"/g, '""')}"`).join(' AND ');
                const result = this.db.exec(`
          SELECT mi.* FROM minion_index mi
          JOIN minion_index_fts fts ON mi.id = fts.id
          WHERE fts.minion_index_fts MATCH $query
            AND mi.deleted_at IS NULL
        `, { $query: ftsQuery });

                return this.rowsToEntries(result);
            } catch {
                // FTS query failed — fall through to LIKE search
            }
        }

        // Fallback to LIKE-based search
        const all = await this.list();
        const lowerTokens = tokens.map((t) => t.toLowerCase());
        return all.filter((e) => {
            const text = e.searchableText.toLowerCase();
            return lowerTokens.every((token) => text.includes(token));
        });
    }

    async count(filter?: StorageFilter): Promise<number> {
        const conditions: string[] = [];
        const params: Record<string, unknown> = {};

        const includeDeleted = filter?.includeDeleted ?? false;
        if (!includeDeleted) {
            conditions.push('deleted_at IS NULL');
        }

        if (filter?.minionTypeId !== undefined) {
            conditions.push('minion_type_id = $minionTypeId');
            params.$minionTypeId = filter.minionTypeId;
        }

        if (filter?.status !== undefined) {
            conditions.push('status = $status');
            params.$status = filter.status;
        }

        const where = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const result = this.db.exec(`SELECT COUNT(*) as cnt FROM minion_index ${where}`, params);
        let total = result.length > 0 && result[0].values.length > 0
            ? (result[0].values[0][0] as number)
            : 0;

        // Count with tag filtering requires client-side (tags are JSON)
        if (filter?.tags && filter.tags.length > 0) {
            const results = await this.list(filter);
            total = results.length;
        }

        return total;
    }

    async clear(): Promise<void> {
        this.db.run('DELETE FROM minion_index');
        this.persist();
    }

    /**
     * Close the SQLite database connection.
     * Call this when you're done with the adapter.
     */
    close(): void {
        this.db.close();
    }
}
