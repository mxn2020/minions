import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MemoryStorageAdapter } from '../storage/MemoryStorageAdapter.js';
import { JsonFileStorageAdapter } from '../storage/JsonFileStorageAdapter.js';
import { createMinion } from '../lifecycle/index.js';
import { noteType, agentType } from '../schemas/index.js';
import type { StorageAdapter } from '../storage/StorageAdapter.js';

// ─── Helper ──────────────────────────────────────────────────────────────────

function makeNote(title: string, content: string) {
    return createMinion({ title, fields: { content } }, noteType).minion;
}

// ─── Shared adapter tests ─────────────────────────────────────────────────────

function runAdapterTests(name: string, factory: () => Promise<StorageAdapter>) {
    describe(name, () => {
        let adapter: StorageAdapter;

        beforeEach(async () => {
            adapter = await factory();
        });

        it('should return undefined for unknown id', async () => {
            expect(await adapter.get('non-existent')).toBeUndefined();
        });

        it('should store and retrieve a minion', async () => {
            const minion = makeNote('Hello', 'World');
            await adapter.set(minion);
            const result = await adapter.get(minion.id);
            expect(result).toBeDefined();
            expect(result!.id).toBe(minion.id);
            expect(result!.title).toBe('Hello');
        });

        it('should overwrite an existing minion on set', async () => {
            const minion = makeNote('Original', 'content');
            await adapter.set(minion);
            const updated = { ...minion, title: 'Updated' };
            await adapter.set(updated);
            const result = await adapter.get(minion.id);
            expect(result!.title).toBe('Updated');
        });

        it('should delete a minion', async () => {
            const minion = makeNote('To delete', 'bye');
            await adapter.set(minion);
            await adapter.delete(minion.id);
            expect(await adapter.get(minion.id)).toBeUndefined();
        });

        it('should not throw when deleting a non-existent minion', async () => {
            await expect(adapter.delete('does-not-exist')).resolves.toBeUndefined();
        });

        it('should list all non-deleted minions by default', async () => {
            const m1 = makeNote('A', 'a');
            const m2 = makeNote('B', 'b');
            const m3 = { ...makeNote('C', 'c'), deletedAt: new Date().toISOString() };
            await adapter.set(m1);
            await adapter.set(m2);
            await adapter.set(m3);
            const list = await adapter.list();
            const ids = list.map((m) => m.id);
            expect(ids).toContain(m1.id);
            expect(ids).toContain(m2.id);
            expect(ids).not.toContain(m3.id);
        });

        it('should include deleted minions when includeDeleted is true', async () => {
            const deleted = { ...makeNote('Deleted', 'gone'), deletedAt: new Date().toISOString() };
            await adapter.set(deleted);
            const list = await adapter.list({ includeDeleted: true });
            expect(list.map((m) => m.id)).toContain(deleted.id);
        });

        it('should filter by minionTypeId', async () => {
            const note = makeNote('Note', 'note content');
            const agent = createMinion({ title: 'Agent', fields: { role: 'tester', model: 'gpt-4' } }, agentType).minion;
            await adapter.set(note);
            await adapter.set(agent);
            const notes = await adapter.list({ minionTypeId: noteType.id });
            expect(notes.every((m) => m.minionTypeId === noteType.id)).toBe(true);
            expect(notes.map((m) => m.id)).toContain(note.id);
            expect(notes.map((m) => m.id)).not.toContain(agent.id);
        });

        it('should filter by status', async () => {
            const active = makeNote('Active', 'a');
            const completed = { ...makeNote('Completed', 'c'), status: 'completed' as const };
            await adapter.set(active);
            await adapter.set(completed);
            const results = await adapter.list({ status: 'completed' });
            expect(results.every((m) => m.status === 'completed')).toBe(true);
            expect(results.map((m) => m.id)).toContain(completed.id);
            expect(results.map((m) => m.id)).not.toContain(active.id);
        });

        it('should filter by tags', async () => {
            const tagged = { ...makeNote('Tagged', 'x'), tags: ['ai', 'research'] };
            const other = { ...makeNote('Other', 'y'), tags: ['ai'] };
            await adapter.set(tagged);
            await adapter.set(other);
            const results = await adapter.list({ tags: ['ai', 'research'] });
            expect(results.map((m) => m.id)).toContain(tagged.id);
            expect(results.map((m) => m.id)).not.toContain(other.id);
        });

        it('should respect limit and offset', async () => {
            for (let i = 0; i < 5; i++) {
                await adapter.set(makeNote(`Note ${i}`, `content ${i}`));
            }
            const page = await adapter.list({ limit: 2, offset: 1 });
            expect(page).toHaveLength(2);
        });

        it('should search by keyword in searchableText', async () => {
            const m1 = makeNote('Research Paper', 'quantum computing concepts');
            const m2 = makeNote('Shopping List', 'milk eggs bread');
            await adapter.set(m1);
            await adapter.set(m2);
            const results = await adapter.search('quantum');
            expect(results.map((r) => r.id)).toContain(m1.id);
            expect(results.map((r) => r.id)).not.toContain(m2.id);
        });

        it('should match all tokens in a multi-word search query', async () => {
            const m = makeNote('Quantum Mechanics', 'advanced physics notes');
            await adapter.set(m);
            const found = await adapter.search('quantum mechanics');
            expect(found.map((r) => r.id)).toContain(m.id);
            const notFound = await adapter.search('quantum chemistry');
            expect(notFound.map((r) => r.id)).not.toContain(m.id);
        });

        it('should not return deleted minions in search results', async () => {
            const deleted = { ...makeNote('Deleted Search', 'secret content'), deletedAt: new Date().toISOString() };
            await adapter.set(deleted);
            const results = await adapter.search('secret');
            expect(results.map((r) => r.id)).not.toContain(deleted.id);
        });

        it('should return all non-deleted minions for empty search query', async () => {
            const m1 = makeNote('Alpha', 'content');
            const m2 = makeNote('Beta', 'content');
            await adapter.set(m1);
            await adapter.set(m2);
            const results = await adapter.search('');
            expect(results.length).toBeGreaterThanOrEqual(2);
        });
    });
}

// ─── Run shared tests for both adapters ──────────────────────────────────────

runAdapterTests('MemoryStorageAdapter', async () => new MemoryStorageAdapter());

describe('JsonFileStorageAdapter', () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await mkdtemp(join(tmpdir(), 'minions-test-'));
    });

    afterEach(async () => {
        await rm(tmpDir, { recursive: true, force: true });
    });

    runAdapterTests('shared contract', () => JsonFileStorageAdapter.create(tmpDir));

    it('should persist data across adapter instances (reload from disk)', async () => {
        const adapter1 = await JsonFileStorageAdapter.create(tmpDir);
        const minion = makeNote('Persistent', 'should survive reload');
        await adapter1.set(minion);

        // Create a fresh adapter pointing at the same directory
        const adapter2 = await JsonFileStorageAdapter.create(tmpDir);
        const loaded = await adapter2.get(minion.id);
        expect(loaded).toBeDefined();
        expect(loaded!.id).toBe(minion.id);
        expect(loaded!.title).toBe('Persistent');
    });

    it('should write sharded JSON files', async () => {
        const adapter = await JsonFileStorageAdapter.create(tmpDir);
        const minion = makeNote('Sharded', 'test');
        await adapter.set(minion);

        // Verify the file was written in a sharded path
        const hex = minion.id.replace(/-/g, '');
        const l1 = hex.slice(0, 2);
        const l2 = hex.slice(2, 4);
        const { access } = await import('node:fs/promises');
        await expect(access(join(tmpDir, l1, l2, `${minion.id}.json`))).resolves.toBeUndefined();
    });

    it('should create rootDir if it does not exist', async () => {
        const nested = join(tmpDir, 'deep', 'path');
        const adapter = await JsonFileStorageAdapter.create(nested);
        const minion = makeNote('Deep', 'dir');
        await expect(adapter.set(minion)).resolves.toBeUndefined();
    });
});

// ─── Minions client storage integration ───────────────────────────────────────

describe('Minions client with storage', () => {
    it('should save and load a minion', async () => {
        const { Minions } = await import('../client/index.js');
        const storage = new MemoryStorageAdapter();
        const minions = new Minions({ storage });

        const wrapper = minions.create('note', { title: 'Stored Note', fields: { content: 'hello' } });
        await minions.save(wrapper.data);

        const loaded = await minions.load(wrapper.data.id);
        expect(loaded).toBeDefined();
        expect(loaded!.title).toBe('Stored Note');
    });

    it('should remove a minion from storage and graph', async () => {
        const { Minions } = await import('../client/index.js');
        const storage = new MemoryStorageAdapter();
        const minions = new Minions({ storage });

        const a = minions.create('note', { title: 'A', fields: { content: 'a' } });
        const b = minions.create('note', { title: 'B', fields: { content: 'b' } });
        a.linkTo(b.data.id, 'relates_to');
        await minions.save(a.data);
        await minions.save(b.data);

        await minions.remove(a.data);

        expect(await minions.load(a.data.id)).toBeUndefined();
        expect(minions.graph.getFromSource(a.data.id)).toHaveLength(0);
    });

    it('should list and search persisted minions', async () => {
        const { Minions } = await import('../client/index.js');
        const storage = new MemoryStorageAdapter();
        const minions = new Minions({ storage });

        const n1 = minions.create('note', { title: 'Machine Learning', fields: { content: 'neural networks' } });
        const n2 = minions.create('note', { title: 'Cooking', fields: { content: 'pasta recipe' } });
        await minions.save(n1.data);
        await minions.save(n2.data);

        const all = await minions.listMinions();
        expect(all).toHaveLength(2);

        const found = await minions.searchMinions('neural');
        expect(found).toHaveLength(1);
        expect(found[0].id).toBe(n1.data.id);
    });

    it('should throw when storage methods called without adapter', async () => {
        const { Minions } = await import('../client/index.js');
        const minions = new Minions();
        const n = minions.create('note', { title: 'X', fields: { content: 'y' } });

        await expect(minions.save(n.data)).rejects.toThrow('No storage adapter configured');
        await expect(minions.load('any-id')).rejects.toThrow('No storage adapter configured');
        await expect(minions.remove(n.data)).rejects.toThrow('No storage adapter configured');
        await expect(minions.listMinions()).rejects.toThrow('No storage adapter configured');
        await expect(minions.searchMinions('query')).rejects.toThrow('No storage adapter configured');
    });
});
