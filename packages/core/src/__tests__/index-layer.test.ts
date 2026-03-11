/**
 * @module index-layer.test
 *
 * Comprehensive test suite for the index layer.
 *
 * Coverage:
 * 1. `toIndexEntry()` — projection helper
 * 2. Shared `IndexAdapter` contract — run against ALL adapter implementations:
 *    - MemoryIndexAdapter (in-process)
 *    - SqliteIndexAdapter (file-backed, via better-sqlite3 or :memory:)
 *    - RedisIndexAdapter (mock-backed)
 *    - NeonIndexAdapter (mock-backed)
 *    - SupabaseIndexAdapter (mock-backed)
 * 3. Cross-layer combination tests — every storage adapter × every index adapter
 * 4. Edge cases & adapter-specific behaviour
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { MemoryStorageAdapter } from '../storage/MemoryStorageAdapter.js';
import { JsonFileStorageAdapter } from '../storage/JsonFileStorageAdapter.js';
import { YamlFileStorageAdapter } from '../storage/YamlFileStorageAdapter.js';

import { MemoryIndexAdapter } from '../index-layer/MemoryIndexAdapter.js';
import { toIndexEntry } from '../index-layer/IndexAdapter.js';
import { createMinion } from '../lifecycle/index.js';
import { noteType, agentType, taskType } from '../schemas/index.js';
import type { IndexAdapter } from '../index-layer/IndexAdapter.js';
import type { StorageAdapter } from '../storage/StorageAdapter.js';
import type { Minion } from '../types/index.js';

// ─── Optional dependency detection ──────────────────────────────────────────

let hasSqlJs = false;
try {
    require('sql.js');
    hasSqlJs = true;
} catch {
    // sql.js not installed — SQLite tests will be skipped
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Helpers ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function makeNote(title: string, content: string): Minion {
    return createMinion({ title, fields: { content } }, noteType).minion;
}

function makeAgent(title: string): Minion {
    return createMinion({ title, fields: { role: 'tester', model: 'gpt-4' } }, agentType).minion;
}

function makeTask(title: string): Minion {
    return createMinion({ title, fields: {} }, taskType).minion;
}

// Sleep helper for timestamp-dependent ordering tests
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Mock Factories ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Mock Redis Client ───────────────────────────────────────────────────────

function makeMockRedisClient() {
    const hashes = new Map<string, Record<string, string>>();
    const sets = new Map<string, Set<string>>();
    const sortedSets = new Map<string, Map<string, number>>();

    function getSet(key: string): Set<string> {
        if (!sets.has(key)) sets.set(key, new Set());
        return sets.get(key)!;
    }

    function getSortedSet(key: string): Map<string, number> {
        if (!sortedSets.has(key)) sortedSets.set(key, new Map());
        return sortedSets.get(key)!;
    }

    const client: any = {
        hset: async (key: string, data: Record<string, string>) => {
            hashes.set(key, { ...data });
            return Object.keys(data).length;
        },
        hgetall: async (key: string) => {
            return hashes.get(key) ?? {};
        },
        del: async (...keys: string[]) => {
            let count = 0;
            for (const key of keys) {
                if (hashes.delete(key)) count++;
                if (sets.delete(key)) count++;
                if (sortedSets.delete(key)) count++;
            }
            return count;
        },
        sadd: async (key: string, ...members: string[]) => {
            const s = getSet(key);
            let added = 0;
            for (const m of members) {
                if (!s.has(m)) { s.add(m); added++; }
            }
            return added;
        },
        srem: async (key: string, ...members: string[]) => {
            const s = getSet(key);
            let removed = 0;
            for (const m of members) {
                if (s.delete(m)) removed++;
            }
            return removed;
        },
        smembers: async (key: string) => {
            return Array.from(getSet(key));
        },
        zadd: async (key: string, score: number, member: string) => {
            const zs = getSortedSet(key);
            const isNew = !zs.has(member);
            zs.set(member, score);
            return isNew ? 1 : 0;
        },
        zrem: async (key: string, ...members: string[]) => {
            const zs = getSortedSet(key);
            let removed = 0;
            for (const m of members) {
                if (zs.delete(m)) removed++;
            }
            return removed;
        },
        zrangebyscore: async (key: string) => {
            const zs = getSortedSet(key);
            return Array.from(zs.entries())
                .sort(([, a], [, b]) => a - b)
                .map(([m]) => m);
        },
        keys: async (pattern: string) => {
            const prefix = pattern.replace(/\*$/, '');
            const allKeys = [...hashes.keys(), ...sets.keys(), ...sortedSets.keys()];
            return allKeys.filter((k) => k.startsWith(prefix));
        },
        pipeline: () => {
            const ops: Array<() => Promise<unknown>> = [];
            const pipe: any = {
                hset: (key: string, data: Record<string, string>) => { ops.push(() => client.hset(key, data)); return pipe; },
                del: (...keys: string[]) => { ops.push(() => client.del(...keys)); return pipe; },
                sadd: (key: string, ...members: string[]) => { ops.push(() => client.sadd(key, ...members)); return pipe; },
                srem: (key: string, ...members: string[]) => { ops.push(() => client.srem(key, ...members)); return pipe; },
                zadd: (key: string, score: number, member: string) => { ops.push(() => client.zadd(key, score, member)); return pipe; },
                zrem: (key: string, ...members: string[]) => { ops.push(() => client.zrem(key, ...members)); return pipe; },
                exec: async () => {
                    const results = [];
                    for (const op of ops) {
                        results.push([null, await op()]);
                    }
                    return results;
                },
            };
            return pipe;
        },
        call: async () => null,
    };

    return client;
}

// ─── Mock Neon Client ────────────────────────────────────────────────────────

function makeMockNeonClient() {
    const store = new Map<string, Record<string, unknown>>();

    return async function sql(strings: TemplateStringsArray, ...values: unknown[]) {
        // Reconstruct the query with $1, $2, etc. style placeholders
        let query = '';
        for (let i = 0; i < strings.length; i++) {
            query += strings[i];
            if (i < values.length) query += `$${i + 1}`;
        }
        query = query.trim().replace(/\s+/g, ' ');

        // INSERT ... ON CONFLICT (upsert)
        if (query.startsWith('INSERT INTO minion_index')) {
            const [id, title, description, minion_type_id, status, priority, tags,
                searchable_text, created_at, updated_at, deleted_at] = values;
            store.set(id as string, {
                id, title, description, minion_type_id, status, priority, tags,
                searchable_text, created_at, updated_at, deleted_at,
            });
            return [];
        }

        // DELETE
        if (query.startsWith('DELETE FROM minion_index WHERE id')) {
            store.delete(values[0] as string);
            return [];
        }

        if (query.startsWith('DELETE FROM minion_index')) {
            store.clear();
            return [];
        }

        // SELECT with full-text search (to_tsvector)
        if (query.includes('to_tsvector')) {
            const tsQuery = (values[0] as string).split(' & ');
            const results: Record<string, unknown>[] = [];
            for (const row of store.values()) {
                if (row.deleted_at) continue;
                const text = (row.searchable_text as string).toLowerCase();
                if (tsQuery.every((t) => text.includes(t.toLowerCase()))) {
                    results.push(row);
                }
            }
            return results;
        }

        // SELECT with filters
        if (query.startsWith('SELECT * FROM minion_index')) {
            const results: Record<string, unknown>[] = [];
            for (const row of store.values()) {
                let match = true;

                // Check deleted_at filter
                if (query.includes('deleted_at IS NULL') && row.deleted_at) {
                    match = false;
                }

                // Check minion_type_id filter — find the value by looking at which
                // template string segment mentions the column
                if (match && query.includes('minion_type_id =')) {
                    let typeVal: unknown;
                    for (let i = 0; i < strings.length; i++) {
                        if (strings[i].includes('minion_type_id =') && i < values.length) {
                            typeVal = values[i];
                            break;
                        }
                    }
                    if (typeVal !== undefined && row.minion_type_id !== typeVal) {
                        match = false;
                    }
                }

                // Check status filter — same approach
                if (match && query.includes('status =')) {
                    let statusVal: unknown;
                    for (let i = 0; i < strings.length; i++) {
                        if (strings[i].includes('status =') && i < values.length) {
                            statusVal = values[i];
                            break;
                        }
                    }
                    if (statusVal !== undefined && row.status !== statusVal) {
                        match = false;
                    }
                }

                if (match) results.push(row);
            }
            return results;
        }

        return [];
    } as any;
}

// ─── Mock Supabase Client for Index ──────────────────────────────────────────

function makeMockSupabaseIndexClient() {
    const store = new Map<string, Record<string, unknown>>();

    function makeFilterBuilder(getData: () => Record<string, unknown>[]): any {
        let filters: Array<(rows: Record<string, unknown>[]) => Record<string, unknown>[]> = [];
        let textSearchQuery: string | null = null;

        const builder: any = {
            eq(col: string, val: unknown) {
                filters.push((rows) => rows.filter((r) => r[col] === val));
                return builder;
            },
            is(col: string, val: null) {
                filters.push((rows) => rows.filter((r) => r[col] == null || r[col] === ''));
                return builder;
            },
            neq(col: string, val: unknown) {
                filters.push((rows) => rows.filter((r) => r[col] !== val));
                return builder;
            },
            textSearch(col: string, query: string) {
                textSearchQuery = query;
                return builder;
            },
            order(col: string, opts?: { ascending?: boolean }) {
                const asc = opts?.ascending !== false;
                filters.push((rows) =>
                    [...rows].sort((a, b) => {
                        const av = String(a[col] ?? '');
                        const bv = String(b[col] ?? '');
                        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
                    }),
                );
                return builder;
            },
            range(from: number, to: number) {
                filters.push((rows) => rows.slice(from, to + 1));
                return builder;
            },
            limit(count: number) {
                filters.push((rows) => rows.slice(0, count));
                return builder;
            },
            single() { return builder; },
            maybeSingle() { return builder; },
            then(onfulfilled: any) {
                let rows = getData();

                // Apply text search
                if (textSearchQuery) {
                    const tokens = textSearchQuery.split(' & ');
                    rows = rows.filter((r) => {
                        const text = String(r.searchable_text ?? '').toLowerCase();
                        return tokens.every((t) => text.includes(t.toLowerCase()));
                    });
                }

                // Apply all filters
                for (const f of filters) {
                    rows = f(rows);
                }

                return Promise.resolve({ data: rows, error: null }).then(onfulfilled);
            },
        };
        return builder;
    }

    const client = {
        from(_table: string) {
            return {
                select(_columns?: string) {
                    return makeFilterBuilder(() => Array.from(store.values()));
                },
                upsert(values: any, _opts?: any) {
                    store.set(values.id, { ...values });
                    return { then: (fn: any) => Promise.resolve({ data: null, error: null }).then(fn) };
                },
                delete() {
                    return {
                        eq(_col: string, val: unknown) {
                            store.delete(val as string);
                            return { then: (fn: any) => Promise.resolve({ data: null, error: null }).then(fn) };
                        },
                        neq(_col: string, _val: unknown) {
                            store.clear();
                            return { then: (fn: any) => Promise.resolve({ data: null, error: null }).then(fn) };
                        },
                    };
                },
            };
        },
    };

    return client;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── toIndexEntry unit tests ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

describe('toIndexEntry', () => {
    it('should extract core fields from a minion', () => {
        const minion = makeNote('My Title', 'Some content here');
        const entry = toIndexEntry(minion);

        expect(entry.id).toBe(minion.id);
        expect(entry.title).toBe('My Title');
        expect(entry.minionTypeId).toBe(noteType.id);
        expect(entry.createdAt).toBe(minion.createdAt);
        expect(entry.updatedAt).toBe(minion.updatedAt);
        expect(entry.deletedAt).toBeUndefined();
    });

    it('should auto-populate searchableText from title and fields', () => {
        const minion = makeNote('Research Paper', 'quantum computing notes');
        const entry = toIndexEntry(minion);

        expect(entry.searchableText.toLowerCase()).toContain('research paper');
        expect(entry.searchableText.toLowerCase()).toContain('quantum computing notes');
    });

    it('should use existing searchableText if present', () => {
        const minion = { ...makeNote('Test', 'content'), searchableText: 'custom search text' };
        const entry = toIndexEntry(minion);

        expect(entry.searchableText).toBe('custom search text');
    });

    it('should include tags, status, and priority', () => {
        const minion = {
            ...makeNote('Tagged', 'content'),
            tags: ['ai', 'ml'],
            status: 'active' as const,
            priority: 'high' as const,
        };
        const entry = toIndexEntry(minion);

        expect(entry.tags).toEqual(['ai', 'ml']);
        expect(entry.status).toBe('active');
        expect(entry.priority).toBe('high');
    });

    it('should include description in entry', () => {
        const minion = { ...makeNote('Desc', 'content'), description: 'A longer description' };
        const entry = toIndexEntry(minion);

        expect(entry.description).toBe('A longer description');
        expect(entry.searchableText).toBeDefined();
    });

    it('should not include full minion fields', () => {
        const minion = makeNote('Title', 'content');
        const entry = toIndexEntry(minion) as any;

        expect(entry.fields).toBeUndefined();
        expect(entry._legacy).toBeUndefined();
    });

    it('should handle minion with no optional fields', () => {
        const minion = makeNote('Minimal', 'x');
        delete (minion as any).tags;
        delete (minion as any).status;
        delete (minion as any).priority;
        delete (minion as any).description;
        const entry = toIndexEntry(minion);

        expect(entry.id).toBe(minion.id);
        expect(entry.tags).toBeUndefined();
        expect(entry.status).toBeUndefined();
        expect(entry.priority).toBeUndefined();
        expect(entry.description).toBeUndefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Shared IndexAdapter contract tests ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function runIndexAdapterTests(
    name: string,
    factory: () => Promise<IndexAdapter>,
    cleanup?: () => Promise<void>,
) {
    describe(`IndexAdapter contract: ${name}`, () => {
        let adapter: IndexAdapter;

        beforeEach(async () => {
            adapter = await factory();
        });

        afterEach(async () => {
            if (cleanup) await cleanup();
        });

        // ── upsert + list roundtrip ──────────────────────────────────────

        describe('upsert + list', () => {
            it('should store and list a single entry', async () => {
                const minion = makeNote('Hello', 'World');
                await adapter.upsert(toIndexEntry(minion));
                const list = await adapter.list();
                expect(list.map((e) => e.id)).toContain(minion.id);
            });

            it('should store multiple entries', async () => {
                const m1 = makeNote('First', 'a');
                const m2 = makeNote('Second', 'b');
                const m3 = makeNote('Third', 'c');
                await adapter.upsert(toIndexEntry(m1));
                await adapter.upsert(toIndexEntry(m2));
                await adapter.upsert(toIndexEntry(m3));
                const list = await adapter.list();
                expect(list).toHaveLength(3);
            });

            it('should overwrite an existing entry on upsert', async () => {
                const minion = makeNote('Original', 'content');
                await adapter.upsert(toIndexEntry(minion));
                const updated = { ...minion, title: 'Updated' };
                await adapter.upsert(toIndexEntry(updated));
                const list = await adapter.list();
                const entry = list.find((e) => e.id === minion.id);
                expect(entry?.title).toBe('Updated');
                expect(list.filter((e) => e.id === minion.id)).toHaveLength(1);
            });

            it('should preserve all IndexEntry fields on roundtrip', async () => {
                const minion = {
                    ...makeNote('Full Fields', 'my content'),
                    description: 'A description',
                    tags: ['tag1', 'tag2'],
                    status: 'in_progress' as const,
                    priority: 'high' as const,
                };
                const entry = toIndexEntry(minion);
                await adapter.upsert(entry);
                const list = await adapter.list();
                const result = list.find((e) => e.id === minion.id)!;

                expect(result.id).toBe(entry.id);
                expect(result.title).toBe(entry.title);
                expect(result.description).toBe(entry.description);
                expect(result.minionTypeId).toBe(entry.minionTypeId);
                expect(result.status).toBe(entry.status);
                expect(result.priority).toBe(entry.priority);
                expect(result.tags).toEqual(entry.tags);
                expect(result.createdAt).toBe(entry.createdAt);
                expect(result.updatedAt).toBe(entry.updatedAt);
            });
        });

        // ── remove ───────────────────────────────────────────────────────

        describe('remove', () => {
            it('should remove an entry by id', async () => {
                const minion = makeNote('To delete', 'bye');
                await adapter.upsert(toIndexEntry(minion));
                await adapter.remove(minion.id);
                const list = await adapter.list({ includeDeleted: true });
                expect(list.map((e) => e.id)).not.toContain(minion.id);
            });

            it('should not throw for non-existent id', async () => {
                await expect(adapter.remove('does-not-exist')).resolves.toBeUndefined();
            });

            it('should only remove the specified entry', async () => {
                const m1 = makeNote('Keep', 'a');
                const m2 = makeNote('Delete', 'b');
                await adapter.upsert(toIndexEntry(m1));
                await adapter.upsert(toIndexEntry(m2));
                await adapter.remove(m2.id);
                const list = await adapter.list();
                expect(list).toHaveLength(1);
                expect(list[0].id).toBe(m1.id);
            });
        });

        // ── list with filters ────────────────────────────────────────────

        describe('list — filtering', () => {
            it('should exclude deleted entries by default', async () => {
                const m1 = makeNote('Active', 'a');
                const m2 = { ...makeNote('Deleted', 'b'), deletedAt: new Date().toISOString() };
                await adapter.upsert(toIndexEntry(m1));
                await adapter.upsert(toIndexEntry(m2));
                const list = await adapter.list();
                expect(list.map((e) => e.id)).toContain(m1.id);
                expect(list.map((e) => e.id)).not.toContain(m2.id);
            });

            it('should include deleted entries when includeDeleted=true', async () => {
                const deleted = { ...makeNote('Deleted', 'gone'), deletedAt: new Date().toISOString() };
                await adapter.upsert(toIndexEntry(deleted));
                const list = await adapter.list({ includeDeleted: true });
                expect(list.map((e) => e.id)).toContain(deleted.id);
            });

            it('should filter by minionTypeId', async () => {
                const note = makeNote('Note', 'note content');
                const agent = makeAgent('Agent');
                await adapter.upsert(toIndexEntry(note));
                await adapter.upsert(toIndexEntry(agent));

                const notes = await adapter.list({ minionTypeId: noteType.id });
                expect(notes.every((e) => e.minionTypeId === noteType.id)).toBe(true);
                expect(notes.map((e) => e.id)).toContain(note.id);
                expect(notes.map((e) => e.id)).not.toContain(agent.id);
            });

            it('should filter by status', async () => {
                const active = makeNote('Active', 'a');
                const completed = { ...makeNote('Completed', 'c'), status: 'completed' as const };
                await adapter.upsert(toIndexEntry(active));
                await adapter.upsert(toIndexEntry(completed));

                const results = await adapter.list({ status: 'completed' });
                expect(results.every((e) => e.status === 'completed')).toBe(true);
                expect(results.map((e) => e.id)).toContain(completed.id);
                expect(results.map((e) => e.id)).not.toContain(active.id);
            });

            it('should filter by tags (all must match)', async () => {
                const tagged = { ...makeNote('Tagged', 'x'), tags: ['ai', 'research'] };
                const partial = { ...makeNote('Partial', 'y'), tags: ['ai'] };
                const none = makeNote('NoTags', 'z');
                await adapter.upsert(toIndexEntry(tagged));
                await adapter.upsert(toIndexEntry(partial));
                await adapter.upsert(toIndexEntry(none));

                const results = await adapter.list({ tags: ['ai', 'research'] });
                expect(results.map((e) => e.id)).toContain(tagged.id);
                expect(results.map((e) => e.id)).not.toContain(partial.id);
                expect(results.map((e) => e.id)).not.toContain(none.id);
            });

            it('should combine minionTypeId + status filters', async () => {
                const activeNote = makeNote('Active Note', 'a');
                const completedNote = { ...makeNote('Done Note', 'b'), status: 'completed' as const };
                const activeAgent = makeAgent('Active Agent');
                await adapter.upsert(toIndexEntry(activeNote));
                await adapter.upsert(toIndexEntry(completedNote));
                await adapter.upsert(toIndexEntry(activeAgent));

                const results = await adapter.list({ minionTypeId: noteType.id, status: 'completed' });
                expect(results.map((e) => e.id)).toContain(completedNote.id);
                expect(results.map((e) => e.id)).not.toContain(activeNote.id);
                expect(results.map((e) => e.id)).not.toContain(activeAgent.id);
            });

            it('should return empty array when no entries match filter', async () => {
                await adapter.upsert(toIndexEntry(makeNote('Note', 'a')));
                const results = await adapter.list({ status: 'cancelled' });
                expect(results).toEqual([]);
            });
        });

        // ── list — sorting ───────────────────────────────────────────────

        describe('list — sorting', () => {
            it('should sort by title ascending', async () => {
                await adapter.upsert(toIndexEntry(makeNote('Zebra', 'z')));
                await adapter.upsert(toIndexEntry(makeNote('Apple', 'a')));
                await adapter.upsert(toIndexEntry(makeNote('Mango', 'm')));

                const sorted = await adapter.list({ sortBy: 'title', sortOrder: 'asc' });
                const titles = sorted.map((e) => e.title);
                expect(titles).toEqual([...titles].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())));
            });

            it('should sort by title descending', async () => {
                await adapter.upsert(toIndexEntry(makeNote('Zebra', 'z')));
                await adapter.upsert(toIndexEntry(makeNote('Apple', 'a')));
                await adapter.upsert(toIndexEntry(makeNote('Mango', 'm')));

                const sorted = await adapter.list({ sortBy: 'title', sortOrder: 'desc' });
                const titles = sorted.map((e) => e.title);
                expect(titles).toEqual([...titles].sort((a, b) => b.toLowerCase().localeCompare(a.toLowerCase())));
            });
        });

        // ── list — pagination ────────────────────────────────────────────

        describe('list — pagination', () => {
            it('should respect limit', async () => {
                for (let i = 0; i < 5; i++) {
                    await adapter.upsert(toIndexEntry(makeNote(`Note ${i}`, `content ${i}`)));
                }
                const page = await adapter.list({ limit: 3 });
                expect(page).toHaveLength(3);
            });

            it('should respect offset', async () => {
                for (let i = 0; i < 5; i++) {
                    await adapter.upsert(toIndexEntry(makeNote(`Note ${i}`, `content ${i}`)));
                }
                const full = await adapter.list();
                const offset = await adapter.list({ offset: 2 });
                expect(offset).toHaveLength(full.length - 2);
            });

            it('should combine limit and offset', async () => {
                for (let i = 0; i < 10; i++) {
                    await adapter.upsert(toIndexEntry(makeNote(`Note ${i}`, `content ${i}`)));
                }
                const page = await adapter.list({ limit: 3, offset: 4 });
                expect(page).toHaveLength(3);
            });

            it('should return empty when offset exceeds total', async () => {
                await adapter.upsert(toIndexEntry(makeNote('Only', 'one')));
                const page = await adapter.list({ offset: 100 });
                expect(page).toHaveLength(0);
            });
        });

        // ── search ───────────────────────────────────────────────────────

        describe('search', () => {
            it('should find entries by keyword', async () => {
                await adapter.upsert(toIndexEntry(makeNote('Research Paper', 'quantum computing concepts')));
                await adapter.upsert(toIndexEntry(makeNote('Shopping List', 'milk eggs bread')));

                const results = await adapter.search('quantum');
                expect(results.some((e) => e.title === 'Research Paper')).toBe(true);
                expect(results.some((e) => e.title === 'Shopping List')).toBe(false);
            });

            it('should match multi-word queries (AND logic)', async () => {
                const m = makeNote('Quantum Mechanics', 'advanced physics notes');
                await adapter.upsert(toIndexEntry(m));

                const found = await adapter.search('quantum mechanics');
                expect(found.map((e) => e.id)).toContain(m.id);

                const notFound = await adapter.search('quantum chemistry');
                expect(notFound.map((e) => e.id)).not.toContain(m.id);
            });

            it('should be case-insensitive', async () => {
                await adapter.upsert(toIndexEntry(makeNote('UPPERCASE', 'lowercase content')));

                const results = await adapter.search('uppercase');
                expect(results).toHaveLength(1);
            });

            it('should not return deleted entries', async () => {
                const deleted = { ...makeNote('Deleted Search', 'secret'), deletedAt: new Date().toISOString() };
                await adapter.upsert(toIndexEntry(deleted));

                const results = await adapter.search('secret');
                expect(results.map((e) => e.id)).not.toContain(deleted.id);
            });

            it('should return all non-deleted entries for empty query', async () => {
                await adapter.upsert(toIndexEntry(makeNote('Alpha', 'content')));
                await adapter.upsert(toIndexEntry(makeNote('Beta', 'content')));

                const results = await adapter.search('');
                expect(results.length).toBeGreaterThanOrEqual(2);
            });

            it('should return empty for no-match query', async () => {
                await adapter.upsert(toIndexEntry(makeNote('Hello', 'world')));

                const results = await adapter.search('xyznonexistent');
                expect(results).toHaveLength(0);
            });
        });

        // ── count ────────────────────────────────────────────────────────

        describe('count', () => {
            it('should count all non-deleted entries', async () => {
                await adapter.upsert(toIndexEntry(makeNote('A', 'a')));
                await adapter.upsert(toIndexEntry(makeNote('B', 'b')));
                expect(await adapter.count()).toBe(2);
            });

            it('should exclude deleted from count', async () => {
                await adapter.upsert(toIndexEntry(makeNote('Active', 'a')));
                await adapter.upsert(toIndexEntry({ ...makeNote('Deleted', 'b'), deletedAt: new Date().toISOString() }));
                expect(await adapter.count()).toBe(1);
            });

            it('should count with minionTypeId filter', async () => {
                await adapter.upsert(toIndexEntry(makeNote('Note', 'a')));
                await adapter.upsert(toIndexEntry(makeAgent('Agent')));
                expect(await adapter.count({ minionTypeId: noteType.id })).toBe(1);
                expect(await adapter.count({ minionTypeId: agentType.id })).toBe(1);
            });

            it('should return 0 for empty index', async () => {
                expect(await adapter.count()).toBe(0);
            });
        });

        // ── clear ────────────────────────────────────────────────────────

        describe('clear', () => {
            it('should remove all entries', async () => {
                await adapter.upsert(toIndexEntry(makeNote('A', 'a')));
                await adapter.upsert(toIndexEntry(makeNote('B', 'b')));
                await adapter.upsert(toIndexEntry(makeAgent('C')));
                await adapter.clear();
                const list = await adapter.list({ includeDeleted: true });
                expect(list).toHaveLength(0);
            });

            it('should allow re-insertion after clear', async () => {
                await adapter.upsert(toIndexEntry(makeNote('Old', 'data')));
                await adapter.clear();
                await adapter.upsert(toIndexEntry(makeNote('New', 'data')));
                const list = await adapter.list();
                expect(list).toHaveLength(1);
                expect(list[0].title).toBe('New');
            });
        });

        // ── mixed types ──────────────────────────────────────────────────

        describe('mixed minion types', () => {
            it('should handle notes, agents, and tasks simultaneously', async () => {
                const note = makeNote('Note', 'content');
                const agent = makeAgent('Agent');
                const task = makeTask('Task');

                await adapter.upsert(toIndexEntry(note));
                await adapter.upsert(toIndexEntry(agent));
                await adapter.upsert(toIndexEntry(task));

                const all = await adapter.list();
                expect(all).toHaveLength(3);

                const notes = await adapter.list({ minionTypeId: noteType.id });
                expect(notes).toHaveLength(1);

                const agents = await adapter.list({ minionTypeId: agentType.id });
                expect(agents).toHaveLength(1);

                const tasks = await adapter.list({ minionTypeId: taskType.id });
                expect(tasks).toHaveLength(1);
            });
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Run shared contract against ALL index adapters ──────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. MemoryIndexAdapter ───────────────────────────────────────────────────

runIndexAdapterTests('MemoryIndexAdapter', async () => new MemoryIndexAdapter());

// ─── 2. SqliteIndexAdapter (:memory: mode) ───────────────────────────────────

let sqliteAdapterInstance: any;

if (hasSqlJs) {
    runIndexAdapterTests(
        'SqliteIndexAdapter (:memory:)',
        async () => {
            const { SqliteIndexAdapter } = await import('../index-layer/SqliteIndexAdapter.js');
            const adapter = await SqliteIndexAdapter.create(':memory:');
            sqliteAdapterInstance = adapter;
            return adapter;
        },
        async () => {
            if (sqliteAdapterInstance?.close) sqliteAdapterInstance.close();
            sqliteAdapterInstance = null;
        },
    );
} else {
    describe.skip('SqliteIndexAdapter (:memory:) — sql.js not installed', () => {
        it('placeholder', () => { });
    });
}

// ─── 3. SqliteIndexAdapter (file-backed) ─────────────────────────────────────

let sqliteFileTmpDir: string | null = null;
let sqliteFileAdapterInstance: any;

if (hasSqlJs) {
    runIndexAdapterTests(
        'SqliteIndexAdapter (file)',
        async () => {
            const { SqliteIndexAdapter } = await import('../index-layer/SqliteIndexAdapter.js');
            sqliteFileTmpDir = await mkdtemp(join(tmpdir(), 'sqlite-idx-'));
            const adapter = await SqliteIndexAdapter.create(join(sqliteFileTmpDir, 'index.db'));
            sqliteFileAdapterInstance = adapter;
            return adapter;
        },
        async () => {
            if (sqliteFileAdapterInstance?.close) sqliteFileAdapterInstance.close();
            sqliteFileAdapterInstance = null;
            if (sqliteFileTmpDir) {
                await rm(sqliteFileTmpDir, { recursive: true }).catch(() => { });
                sqliteFileTmpDir = null;
            }
        },
    );
} else {
    describe.skip('SqliteIndexAdapter (file) — sql.js not installed', () => {
        it('placeholder', () => { });
    });
}

// ─── 4. RedisIndexAdapter (mock-backed) ──────────────────────────────────────

runIndexAdapterTests(
    'RedisIndexAdapter (mock)',
    async () => {
        const { RedisIndexAdapter } = await import('../index-layer/RedisIndexAdapter.js');
        const client = makeMockRedisClient();
        return new RedisIndexAdapter(client, { prefix: 'test' });
    },
);

// ─── 5. NeonIndexAdapter (mock-backed) ───────────────────────────────────────

runIndexAdapterTests(
    'NeonIndexAdapter (mock)',
    async () => {
        const { NeonIndexAdapter } = await import('../index-layer/NeonIndexAdapter.js');
        const sql = makeMockNeonClient();
        return new NeonIndexAdapter(sql);
    },
);

// ─── 6. SupabaseIndexAdapter (mock-backed) ───────────────────────────────────

runIndexAdapterTests(
    'SupabaseIndexAdapter (mock)',
    async () => {
        const { SupabaseIndexAdapter } = await import('../index-layer/SupabaseIndexAdapter.js');
        const client = makeMockSupabaseIndexClient();
        return new SupabaseIndexAdapter(client as any);
    },
);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Cross-layer combination tests ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

interface LayerCombo {
    name: string;
    storageFactory: () => Promise<StorageAdapter>;
    indexFactory: () => Promise<IndexAdapter>;
    cleanup?: () => Promise<void>;
}

function runCrossLayerTests(combo: LayerCombo) {
    describe(`Cross-layer: ${combo.name}`, () => {
        let storage: StorageAdapter;
        let index: IndexAdapter;
        let client: any; // Minions

        beforeEach(async () => {
            storage = await combo.storageFactory();
            index = await combo.indexFactory();
            const { Minions } = await import('../client/index.js');
            client = new Minions({ storage, index });
        });

        afterEach(async () => {
            if (combo.cleanup) await combo.cleanup();
        });

        it('save() should write to both layers', async () => {
            const wrapper = await client.create('note', { title: 'Synced', fields: { content: 'hello' } });
            await client.save(wrapper.data);

            // Verify storage (full minion)
            const loaded = await client.load(wrapper.data.id);
            expect(loaded).toBeDefined();
            expect(loaded!.title).toBe('Synced');
            expect(loaded!.fields).toBeDefined();

            // Verify index (lightweight entry)
            const entries = await client.listIndex();
            expect(entries.map((e: any) => e.id)).toContain(wrapper.data.id);
            expect(entries[0]).not.toHaveProperty('fields');
        });

        it('remove() should delete from both layers', async () => {
            const wrapper = await client.create('note', { title: 'Remove Me', fields: { content: 'bye' } });
            await client.save(wrapper.data);
            await client.remove(wrapper.data);

            expect(await client.load(wrapper.data.id)).toBeUndefined();
            expect(await client.listIndex()).toHaveLength(0);
        });

        it('listMinions() should return full Minion objects', async () => {
            const w1 = await client.create('note', { title: 'Full1', fields: { content: 'a' } });
            await client.save(w1.data);

            const list = await client.listMinions();
            expect(list).toHaveLength(1);
            expect(list[0].fields).toBeDefined();
            expect(list[0].id).toBe(w1.data.id);
        });

        it('listIndex() should return IndexEntry objects', async () => {
            const w1 = await client.create('note', { title: 'Light1', fields: { content: 'a' } });
            await client.save(w1.data);

            const entries = await client.listIndex();
            expect(entries).toHaveLength(1);
            expect(entries[0]).not.toHaveProperty('fields');
            expect(entries[0].title).toBe('Light1');
            expect(entries[0].searchableText).toBeDefined();
        });

        it('searchIndex() should use the index layer', async () => {
            const w1 = await client.create('note', { title: 'Quantum Physics', fields: { content: 'entanglement' } });
            const w2 = await client.create('note', { title: 'Cooking', fields: { content: 'pasta recipe' } });
            await client.save(w1.data);
            await client.save(w2.data);

            const results = await client.searchIndex('quantum');
            expect(results.map((e: any) => e.title)).toContain('Quantum Physics');
            expect(results.map((e: any) => e.title)).not.toContain('Cooking');
        });

        it('countMinions() should use the index layer', async () => {
            const w1 = await client.create('note', { title: 'A', fields: { content: 'a' } });
            const w2 = await client.create('note', { title: 'B', fields: { content: 'b' } });
            await client.save(w1.data);
            await client.save(w2.data);

            expect(await client.countMinions()).toBe(2);
        });

        it('should handle multiple types across both layers', async () => {
            const note = await client.create('note', { title: 'MyNote', fields: { content: 'c' } });
            const agent = await client.create('agent', { title: 'MyAgent', fields: { role: 'r', model: 'm' } });
            await client.save(note.data);
            await client.save(agent.data);

            // Full list
            const all = await client.listMinions();
            expect(all).toHaveLength(2);

            // Index list
            const allIdx = await client.listIndex();
            expect(allIdx).toHaveLength(2);

            // Filter by type via index
            const notesOnly = await client.listIndex({ minionTypeId: noteType.id });
            expect(notesOnly).toHaveLength(1);
            expect(notesOnly[0].title).toBe('MyNote');
        });

        it('update + save should sync index with new data', async () => {
            const wrapper = await client.create('note', { title: 'Original', fields: { content: 'v1' } });
            await client.save(wrapper.data);

            const updated = await client.update(wrapper.data, { title: 'Updated' });
            await client.save(updated.data);

            const entries = await client.listIndex();
            const entry = entries.find((e: any) => e.id === wrapper.data.id);
            expect(entry?.title).toBe('Updated');

            // Full load should also reflect the update
            const loaded = await client.load(wrapper.data.id);
            expect(loaded!.title).toBe('Updated');
        });
    });
}

// ─── Define all storage × index combinations ────────────────────────────────

const tmpDirs: string[] = [];

afterEach(async () => {
    for (const d of tmpDirs) {
        await rm(d, { recursive: true }).catch(() => { });
    }
    tmpDirs.length = 0;
});

// === MemoryStorage × each index adapter ===

runCrossLayerTests({
    name: 'MemoryStorage + MemoryIndex',
    storageFactory: async () => new MemoryStorageAdapter(),
    indexFactory: async () => new MemoryIndexAdapter(),
});

if (hasSqlJs) {
    runCrossLayerTests({
        name: 'MemoryStorage + SqliteIndex (:memory:)',
        storageFactory: async () => new MemoryStorageAdapter(),
        indexFactory: async () => {
            const { SqliteIndexAdapter } = await import('../index-layer/SqliteIndexAdapter.js');
            return SqliteIndexAdapter.create(':memory:');
        },
    });
}

runCrossLayerTests({
    name: 'MemoryStorage + RedisIndex (mock)',
    storageFactory: async () => new MemoryStorageAdapter(),
    indexFactory: async () => {
        const { RedisIndexAdapter } = await import('../index-layer/RedisIndexAdapter.js');
        return new RedisIndexAdapter(makeMockRedisClient(), { prefix: 'combo' });
    },
});

runCrossLayerTests({
    name: 'MemoryStorage + NeonIndex (mock)',
    storageFactory: async () => new MemoryStorageAdapter(),
    indexFactory: async () => {
        const { NeonIndexAdapter } = await import('../index-layer/NeonIndexAdapter.js');
        return new NeonIndexAdapter(makeMockNeonClient());
    },
});

runCrossLayerTests({
    name: 'MemoryStorage + SupabaseIndex (mock)',
    storageFactory: async () => new MemoryStorageAdapter(),
    indexFactory: async () => {
        const { SupabaseIndexAdapter } = await import('../index-layer/SupabaseIndexAdapter.js');
        return new SupabaseIndexAdapter(makeMockSupabaseIndexClient() as any);
    },
});

// === JsonFileStorage × each index adapter ===

runCrossLayerTests({
    name: 'JsonFileStorage + MemoryIndex',
    storageFactory: async () => {
        const dir = await mkdtemp(join(tmpdir(), 'json-mem-'));
        tmpDirs.push(dir);
        return JsonFileStorageAdapter.create(dir);
    },
    indexFactory: async () => new MemoryIndexAdapter(),
});

if (hasSqlJs) {
    runCrossLayerTests({
        name: 'JsonFileStorage + SqliteIndex (:memory:)',
        storageFactory: async () => {
            const dir = await mkdtemp(join(tmpdir(), 'json-sqlite-'));
            tmpDirs.push(dir);
            return JsonFileStorageAdapter.create(dir);
        },
        indexFactory: async () => {
            const { SqliteIndexAdapter } = await import('../index-layer/SqliteIndexAdapter.js');
            return SqliteIndexAdapter.create(':memory:');
        },
    });
}

// === YamlFileStorage × each index adapter ===

runCrossLayerTests({
    name: 'YamlFileStorage + MemoryIndex',
    storageFactory: async () => {
        const dir = await mkdtemp(join(tmpdir(), 'yaml-mem-'));
        tmpDirs.push(dir);
        return YamlFileStorageAdapter.create(dir);
    },
    indexFactory: async () => new MemoryIndexAdapter(),
});

if (hasSqlJs) {
    runCrossLayerTests({
        name: 'YamlFileStorage + SqliteIndex (:memory:)',
        storageFactory: async () => {
            const dir = await mkdtemp(join(tmpdir(), 'yaml-sqlite-'));
            tmpDirs.push(dir);
            return YamlFileStorageAdapter.create(dir);
        },
        indexFactory: async () => {
            const { SqliteIndexAdapter } = await import('../index-layer/SqliteIndexAdapter.js');
            return SqliteIndexAdapter.create(':memory:');
        },
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Single-layer fallback tests ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

describe('Single-layer fallback (no index configured)', () => {
    it('listIndex() should fall back to storage.list() + toIndexEntry()', async () => {
        const { Minions } = await import('../client/index.js');
        const storage = new MemoryStorageAdapter();
        const minions = new Minions({ storage }); // no index!

        const n = await minions.create('note', { title: 'Fallback', fields: { content: 'test' } });
        await minions.save(n.data);

        const entries = await minions.listIndex();
        expect(entries).toHaveLength(1);
        expect(entries[0].title).toBe('Fallback');
        expect(entries[0]).not.toHaveProperty('fields');
    });

    it('searchIndex() should fall back to storage.search() + toIndexEntry()', async () => {
        const { Minions } = await import('../client/index.js');
        const storage = new MemoryStorageAdapter();
        const minions = new Minions({ storage });

        const n = await minions.create('note', { title: 'Quantum', fields: { content: 'physics' } });
        await minions.save(n.data);

        const results = await minions.searchIndex('quantum');
        expect(results).toHaveLength(1);
        expect(results[0]).not.toHaveProperty('fields');
    });

    it('countMinions() should fall back to storage.list().length', async () => {
        const { Minions } = await import('../client/index.js');
        const storage = new MemoryStorageAdapter();
        const minions = new Minions({ storage });

        const w1 = await minions.create('note', { title: 'A', fields: { content: 'a' } });
        const w2 = await minions.create('note', { title: 'B', fields: { content: 'b' } });
        await minions.save(w1.data);
        await minions.save(w2.data);

        expect(await minions.countMinions()).toBe(2);
    });

    it('save() and remove() should work without index layer', async () => {
        const { Minions } = await import('../client/index.js');
        const storage = new MemoryStorageAdapter();
        const minions = new Minions({ storage });

        const w = await minions.create('note', { title: 'NoIndex', fields: { content: 'x' } });
        await minions.save(w.data);
        expect(await minions.load(w.data.id)).toBeDefined();

        await minions.remove(w.data);
        expect(await minions.load(w.data.id)).toBeUndefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Adapter-specific tests ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

describe.skipIf(!hasSqlJs)('SqliteIndexAdapter — specific', () => {
    it('should create file-backed database', async () => {
        const { SqliteIndexAdapter } = await import('../index-layer/SqliteIndexAdapter.js');
        const dir = await mkdtemp(join(tmpdir(), 'sqlite-spec-'));
        tmpDirs.push(dir);

        const adapter = await SqliteIndexAdapter.create(join(dir, 'test.db'));
        await adapter.upsert(toIndexEntry(makeNote('File DB', 'test')));
        const list = await adapter.list();
        expect(list).toHaveLength(1);
        adapter.close();
    });

    it('should persist across instances (file mode)', async () => {
        const { SqliteIndexAdapter } = await import('../index-layer/SqliteIndexAdapter.js');
        const dir = await mkdtemp(join(tmpdir(), 'sqlite-persist-'));
        tmpDirs.push(dir);
        const dbPath = join(dir, 'persist.db');

        const adapter1 = await SqliteIndexAdapter.create(dbPath);
        await adapter1.upsert(toIndexEntry(makeNote('Persisted', 'test')));
        adapter1.close();

        const adapter2 = await SqliteIndexAdapter.create(dbPath);
        const list = await adapter2.list();
        expect(list).toHaveLength(1);
        expect(list[0].title).toBe('Persisted');
        adapter2.close();
    });

    it('should use FTS5 for full-text search', async () => {
        const { SqliteIndexAdapter } = await import('../index-layer/SqliteIndexAdapter.js');
        const adapter = await SqliteIndexAdapter.create(':memory:');

        // Insert entries with varied content
        await adapter.upsert(toIndexEntry(makeNote('Machine Learning', 'neural networks deep learning')));
        await adapter.upsert(toIndexEntry(makeNote('Cooking Recipe', 'pasta carbonara italian')));
        await adapter.upsert(toIndexEntry(makeNote('Deep Space', 'astronomy galaxies stars')));

        const results = await adapter.search('deep');
        // Should find at least the "Machine Learning" entry (deep learning) and "Deep Space"
        expect(results.length).toBeGreaterThanOrEqual(1);
        expect(results.some((e) => e.searchableText.toLowerCase().includes('deep'))).toBe(true);
        adapter.close();
    });
});

describe('SupabaseIndexAdapter — specific', () => {
    it('should generate DDL with custom table name', async () => {
        const { SupabaseIndexAdapter } = await import('../index-layer/SupabaseIndexAdapter.js');
        const ddl = SupabaseIndexAdapter.createTableSQL('custom_index');
        expect(ddl).toContain('CREATE TABLE IF NOT EXISTS custom_index');
        expect(ddl).toContain('searchable_text');
        expect(ddl).toContain('to_tsvector');
        expect(ddl).toContain('idx_custom_index_fts');
    });

    it('should generate DDL with default table name', async () => {
        const { SupabaseIndexAdapter } = await import('../index-layer/SupabaseIndexAdapter.js');
        const ddl = SupabaseIndexAdapter.createTableSQL();
        expect(ddl).toContain('minion_index');
    });
});

describe('NeonIndexAdapter — specific', () => {
    it('should generate DDL with custom table name', async () => {
        const { NeonIndexAdapter } = await import('../index-layer/NeonIndexAdapter.js');
        const ddl = NeonIndexAdapter.createTableSQL('my_index');
        expect(ddl).toContain('CREATE TABLE IF NOT EXISTS my_index');
        expect(ddl).toContain('to_tsvector');
    });
});

describe('RedisIndexAdapter — specific', () => {
    it('should use custom prefix', async () => {
        const { RedisIndexAdapter } = await import('../index-layer/RedisIndexAdapter.js');
        const client = makeMockRedisClient();
        const adapter = new RedisIndexAdapter(client, { prefix: 'myapp' });

        await adapter.upsert(toIndexEntry(makeNote('Prefixed', 'test')));
        const list = await adapter.list();
        expect(list).toHaveLength(1);

        // Verify keys have the correct prefix
        const keys = await client.keys('myapp:*');
        expect(keys.length).toBeGreaterThan(0);
        expect(keys.every((k: string) => k.startsWith('myapp:'))).toBe(true);
    });
});
