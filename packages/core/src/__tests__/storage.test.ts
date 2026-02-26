import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MemoryStorageAdapter } from '../storage/MemoryStorageAdapter.js';
import { JsonFileStorageAdapter } from '../storage/JsonFileStorageAdapter.js';
import { YamlFileStorageAdapter } from '../storage/YamlFileStorageAdapter.js';
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

        it('should sort by title ascending', async () => {
            const m1 = makeNote('Zebra', 'z');
            const m2 = makeNote('Apple', 'a');
            const m3 = makeNote('Mango', 'm');
            await adapter.set(m1);
            await adapter.set(m2);
            await adapter.set(m3);
            const sorted = await adapter.list({ sortBy: 'title', sortOrder: 'asc' });
            const titles = sorted.map((m) => m.title);
            expect(titles).toEqual([...titles].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())));
        });

        it('should sort by title descending', async () => {
            const m1 = makeNote('Zebra', 'z');
            const m2 = makeNote('Apple', 'a');
            const m3 = makeNote('Mango', 'm');
            await adapter.set(m1);
            await adapter.set(m2);
            await adapter.set(m3);
            const sorted = await adapter.list({ sortBy: 'title', sortOrder: 'desc' });
            const titles = sorted.map((m) => m.title);
            expect(titles).toEqual([...titles].sort((a, b) => b.toLowerCase().localeCompare(a.toLowerCase())));
        });

        it('should sort combined with limit and offset', async () => {
            const m1 = makeNote('Zebra', 'z');
            const m2 = makeNote('Apple', 'a');
            const m3 = makeNote('Mango', 'm');
            await adapter.set(m1);
            await adapter.set(m2);
            await adapter.set(m3);
            // Sort by title asc => Apple, Mango, Zebra — take 1 from offset 1 => Mango
            const page = await adapter.list({ sortBy: 'title', sortOrder: 'asc', limit: 1, offset: 1 });
            expect(page).toHaveLength(1);
            expect(page[0].title).toBe('Mango');
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

describe('YamlFileStorageAdapter', () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await mkdtemp(join(tmpdir(), 'minions-yaml-test-'));
    });

    afterEach(async () => {
        await rm(tmpDir, { recursive: true, force: true });
    });

    runAdapterTests('shared contract', () => YamlFileStorageAdapter.create(tmpDir));

    it('should persist data across adapter instances (reload from disk)', async () => {
        const adapter1 = await YamlFileStorageAdapter.create(tmpDir);
        const minion = makeNote('Persistent YAML', 'should survive reload');
        await adapter1.set(minion);

        // Create a fresh adapter pointing at the same directory
        const adapter2 = await YamlFileStorageAdapter.create(tmpDir);
        const loaded = await adapter2.get(minion.id);
        expect(loaded).toBeDefined();
        expect(loaded!.id).toBe(minion.id);
        expect(loaded!.title).toBe('Persistent YAML');
    });

    it('should write sharded YAML files', async () => {
        const adapter = await YamlFileStorageAdapter.create(tmpDir);
        const minion = makeNote('Sharded YAML', 'test');
        await adapter.set(minion);

        // Verify the file was written in a sharded path
        const hex = minion.id.replace(/-/g, '');
        const l1 = hex.slice(0, 2);
        const l2 = hex.slice(2, 4);
        const { access } = await import('node:fs/promises');
        await expect(access(join(tmpDir, l1, l2, `${minion.id}.yaml`))).resolves.toBeUndefined();
    });

    it('should write valid YAML (not JSON) to disk', async () => {
        const adapter = await YamlFileStorageAdapter.create(tmpDir);
        const minion = makeNote('YAML Format', 'verify file format');
        await adapter.set(minion);

        const hex = minion.id.replace(/-/g, '');
        const filePath = join(tmpDir, hex.slice(0, 2), hex.slice(2, 4), `${minion.id}.yaml`);
        const content = await readFile(filePath, 'utf8');

        // Should NOT be JSON
        expect(() => JSON.parse(content)).toThrow();
        // Should contain YAML-style key: value pairs
        expect(content).toContain('title: YAML Format');
        expect(content).toContain('id: ');
    });

    it('should create rootDir if it does not exist', async () => {
        const nested = join(tmpDir, 'deep', 'path');
        const adapter = await YamlFileStorageAdapter.create(nested);
        const minion = makeNote('Deep YAML', 'dir');
        await expect(adapter.set(minion)).resolves.toBeUndefined();
    });

    it('should roundtrip fields through YAML serialization', async () => {
        const adapter1 = await YamlFileStorageAdapter.create(tmpDir);
        const minion = makeNote('Roundtrip', 'content with special: chars');
        await adapter1.set(minion);

        const adapter2 = await YamlFileStorageAdapter.create(tmpDir);
        const loaded = await adapter2.get(minion.id);
        expect(loaded).toBeDefined();
        expect(loaded!.title).toBe('Roundtrip');
        expect(loaded!.fields?.content).toBe('content with special: chars');
    });
});

// ─── Minions client storage integration ───────────────────────────────────────

describe('Minions client with storage', () => {
    it('should save and load a minion', async () => {
        const { Minions } = await import('../client/index.js');
        const storage = new MemoryStorageAdapter();
        const minions = new Minions({ storage });

        const wrapper = await minions.create('note', { title: 'Stored Note', fields: { content: 'hello' } });
        await minions.save(wrapper.data);

        const loaded = await minions.load(wrapper.data.id);
        expect(loaded).toBeDefined();
        expect(loaded!.title).toBe('Stored Note');
    });

    it('should remove a minion from storage and graph', async () => {
        const { Minions } = await import('../client/index.js');
        const storage = new MemoryStorageAdapter();
        const minions = new Minions({ storage });

        const a = await minions.create('note', { title: 'A', fields: { content: 'a' } });
        const b = await minions.create('note', { title: 'B', fields: { content: 'b' } });
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

        const n1 = await minions.create('note', { title: 'Machine Learning', fields: { content: 'neural networks' } });
        const n2 = await minions.create('note', { title: 'Cooking', fields: { content: 'pasta recipe' } });
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
        const n = await minions.create('note', { title: 'X', fields: { content: 'y' } });

        await expect(minions.save(n.data)).rejects.toThrow('No storage adapter configured');
        await expect(minions.load('any-id')).rejects.toThrow('No storage adapter configured');
        await expect(minions.remove(n.data)).rejects.toThrow('No storage adapter configured');
        await expect(minions.listMinions()).rejects.toThrow('No storage adapter configured');
        await expect(minions.searchMinions('query')).rejects.toThrow('No storage adapter configured');
    });
});

// ─── withHooks storage proxy ─────────────────────────────────────────────────

describe('withHooks', () => {
    it('should pass through when no hooks are provided', async () => {
        const { withHooks } = await import('../storage/withHooks.js');
        const inner = new MemoryStorageAdapter();
        const hooked = withHooks(inner, {});

        const minion = makeNote('Passthrough', 'content');
        await hooked.set(minion);
        const loaded = await hooked.get(minion.id);
        expect(loaded).toBeDefined();
        expect(loaded!.title).toBe('Passthrough');
    });

    it('should call beforeSet and allow transformation', async () => {
        const { withHooks } = await import('../storage/withHooks.js');
        const inner = new MemoryStorageAdapter();

        const hooked = withHooks(inner, {
            beforeSet: async (minion) => {
                return { ...minion, title: minion.title.toUpperCase() };
            },
        });

        const minion = makeNote('hello', 'world');
        await hooked.set(minion);
        const loaded = await inner.get(minion.id);
        expect(loaded!.title).toBe('HELLO');
    });

    it('should call afterSet with the stored minion', async () => {
        const { withHooks } = await import('../storage/withHooks.js');
        const inner = new MemoryStorageAdapter();
        let afterSetMinion: any;

        const hooked = withHooks(inner, {
            afterSet: async (minion) => {
                afterSetMinion = minion;
            },
        });

        const minion = makeNote('AfterSet', 'test');
        await hooked.set(minion);
        expect(afterSetMinion).toBeDefined();
        expect(afterSetMinion.title).toBe('AfterSet');
    });

    it('should call beforeGet and afterGet', async () => {
        const { withHooks } = await import('../storage/withHooks.js');
        const inner = new MemoryStorageAdapter();
        const log: string[] = [];

        const hooked = withHooks(inner, {
            beforeGet: async (id) => { log.push(`before:${id}`); },
            afterGet: async (id, result) => { log.push(`after:${id}:${result?.title ?? 'undefined'}`); },
        });

        const minion = makeNote('GetHooks', 'data');
        await inner.set(minion);

        await hooked.get(minion.id);
        await hooked.get('nonexistent');

        expect(log).toEqual([
            `before:${minion.id}`,
            `after:${minion.id}:GetHooks`,
            'before:nonexistent',
            'after:nonexistent:undefined',
        ]);
    });

    it('should call beforeDelete and afterDelete', async () => {
        const { withHooks } = await import('../storage/withHooks.js');
        const inner = new MemoryStorageAdapter();
        const log: string[] = [];

        const hooked = withHooks(inner, {
            beforeDelete: async (id) => { log.push(`before:${id}`); },
            afterDelete: async (id) => { log.push(`after:${id}`); },
        });

        const minion = makeNote('DeleteHooks', 'data');
        await inner.set(minion);
        await hooked.delete(minion.id);

        expect(log).toEqual([`before:${minion.id}`, `after:${minion.id}`]);
        expect(await inner.get(minion.id)).toBeUndefined();
    });

    it('should call beforeList and afterList', async () => {
        const { withHooks } = await import('../storage/withHooks.js');
        const inner = new MemoryStorageAdapter();
        let listCount = 0;

        const hooked = withHooks(inner, {
            afterList: async (results) => { listCount = results.length; },
        });

        await inner.set(makeNote('A', 'a'));
        await inner.set(makeNote('B', 'b'));
        await hooked.list();

        expect(listCount).toBe(2);
    });

    it('should call beforeSearch and afterSearch', async () => {
        const { withHooks } = await import('../storage/withHooks.js');
        const inner = new MemoryStorageAdapter();
        let searchQuery = '';
        let searchCount = 0;

        const hooked = withHooks(inner, {
            beforeSearch: async (query) => { searchQuery = query; },
            afterSearch: async (results) => { searchCount = results.length; },
        });

        await inner.set(makeNote('Quantum Physics', 'entanglement'));
        await hooked.search('quantum');

        expect(searchQuery).toBe('quantum');
        expect(searchCount).toBe(1);
    });

    it('should propagate errors from hooks', async () => {
        const { withHooks } = await import('../storage/withHooks.js');
        const inner = new MemoryStorageAdapter();

        const hooked = withHooks(inner, {
            beforeSet: async () => { throw new Error('Hook failed'); },
        });

        await expect(hooked.set(makeNote('Error', 'test'))).rejects.toThrow('Hook failed');
    });
});

// ─── Directory Mode Tests ───────────────────────────────────────────────────

describe('JsonFileStorageAdapter (directory mode)', () => {
    let tmpDir: string;
    let adapter: JsonFileStorageAdapter;

    beforeEach(async () => {
        tmpDir = await mkdtemp(join(tmpdir(), 'json-dir-'));
        adapter = await JsonFileStorageAdapter.create(tmpDir, { directoryMode: true });
    });

    afterEach(async () => {
        await rm(tmpDir, { recursive: true });
    });

    it('should store minion in directory layout', async () => {
        const minion = makeNote('DirTest', 'content');
        await adapter.set(minion);
        const result = await adapter.get(minion.id);
        expect(result).toBeDefined();
        expect(result!.title).toBe('DirTest');

        // Verify the file is in <id>/minion.json
        const hex = minion.id.replace(/-/g, '');
        const expectedPath = join(tmpDir, hex.slice(0, 2), hex.slice(2, 4), minion.id, 'minion.json');
        const raw = await readFile(expectedPath, 'utf8');
        expect(JSON.parse(raw).title).toBe('DirTest');
    });

    it('should delete entire directory on delete', async () => {
        const minion = makeNote('DeleteDir', 'test');
        await adapter.set(minion);
        await adapter.putFile(minion.id, 'extra.txt', new TextEncoder().encode('hello'));
        await adapter.delete(minion.id);
        expect(await adapter.get(minion.id)).toBeUndefined();
        expect(await adapter.listFiles(minion.id)).toEqual([]);
    });
});

describe('YamlFileStorageAdapter (directory mode)', () => {
    let tmpDir: string;
    let adapter: YamlFileStorageAdapter;

    beforeEach(async () => {
        tmpDir = await mkdtemp(join(tmpdir(), 'yaml-dir-'));
        adapter = await YamlFileStorageAdapter.create(tmpDir, { directoryMode: true });
    });

    afterEach(async () => {
        await rm(tmpDir, { recursive: true });
    });

    it('should store minion in directory layout', async () => {
        const minion = makeNote('YamlDirTest', 'content');
        await adapter.set(minion);
        const result = await adapter.get(minion.id);
        expect(result).toBeDefined();
        expect(result!.title).toBe('YamlDirTest');

        // Verify the file is in <id>/minion.yaml
        const hex = minion.id.replace(/-/g, '');
        const expectedPath = join(tmpDir, hex.slice(0, 2), hex.slice(2, 4), minion.id, 'minion.yaml');
        const raw = await readFile(expectedPath, 'utf8');
        expect(raw).toContain('YamlDirTest');
    });

    it('should delete entire directory on delete', async () => {
        const minion = makeNote('DeleteDir', 'test');
        await adapter.set(minion);
        await adapter.putFile(minion.id, 'notes.md', new TextEncoder().encode('# Notes'));
        await adapter.delete(minion.id);
        expect(await adapter.get(minion.id)).toBeUndefined();
        expect(await adapter.listFiles(minion.id)).toEqual([]);
    });
});

// ─── File Operations Tests ──────────────────────────────────────────────────

function runFileOperationTests(
    name: string,
    factory: () => Promise<StorageAdapter & {
        putFile: (id: string, filename: string, data: Uint8Array) => Promise<void>;
        getFile: (id: string, filename: string) => Promise<Uint8Array | undefined>;
        deleteFile: (id: string, filename: string) => Promise<void>;
        listFiles: (id: string) => Promise<string[]>;
    }>,
) {
    describe(`${name} — file operations`, () => {
        let adapter: Awaited<ReturnType<typeof factory>>;

        beforeEach(async () => {
            adapter = await factory();
        });

        it('should store and retrieve a file', async () => {
            const minion = makeNote('WithFile', 'content');
            await adapter.set(minion);

            const data = new TextEncoder().encode('Hello, World!');
            await adapter.putFile(minion.id, 'greeting.txt', data);

            const result = await adapter.getFile(minion.id, 'greeting.txt');
            expect(result).toBeDefined();
            expect(new TextDecoder().decode(result!)).toBe('Hello, World!');
        });

        it('should list attachment files (excluding primary)', async () => {
            const minion = makeNote('MultiFiles', 'content');
            await adapter.set(minion);

            await adapter.putFile(minion.id, 'readme.md', new TextEncoder().encode('# Readme'));
            await adapter.putFile(minion.id, 'data.csv', new TextEncoder().encode('a,b,c'));

            const files = await adapter.listFiles(minion.id);
            expect(files.sort()).toEqual(['data.csv', 'readme.md']);
        });

        it('should delete a specific file', async () => {
            const minion = makeNote('DeleteFile', 'content');
            await adapter.set(minion);

            await adapter.putFile(minion.id, 'temp.txt', new TextEncoder().encode('temp'));
            await adapter.deleteFile(minion.id, 'temp.txt');

            const result = await adapter.getFile(minion.id, 'temp.txt');
            expect(result).toBeUndefined();
        });

        it('should return undefined for non-existent file', async () => {
            const minion = makeNote('NoFile', 'content');
            await adapter.set(minion);

            const result = await adapter.getFile(minion.id, 'missing.txt');
            expect(result).toBeUndefined();
        });

        it('should return empty array for minion with no files', async () => {
            const files = await adapter.listFiles('non-existent-id');
            expect(files).toEqual([]);
        });

        it('should overwrite existing file on putFile', async () => {
            const minion = makeNote('Overwrite', 'content');
            await adapter.set(minion);

            await adapter.putFile(minion.id, 'file.txt', new TextEncoder().encode('v1'));
            await adapter.putFile(minion.id, 'file.txt', new TextEncoder().encode('v2'));

            const result = await adapter.getFile(minion.id, 'file.txt');
            expect(new TextDecoder().decode(result!)).toBe('v2');
        });

        it('should handle binary data', async () => {
            const minion = makeNote('Binary', 'content');
            await adapter.set(minion);

            const binary = new Uint8Array([0x00, 0xFF, 0x42, 0x89, 0xAB]);
            await adapter.putFile(minion.id, 'binary.bin', binary);

            const result = await adapter.getFile(minion.id, 'binary.bin');
            expect(result).toBeDefined();
            expect(Array.from(result!)).toEqual([0x00, 0xFF, 0x42, 0x89, 0xAB]);
        });
    });
}

// Run file operation tests for all adapters
let fileTmpDirs: string[] = [];

afterEach(async () => {
    for (const d of fileTmpDirs) {
        await rm(d, { recursive: true }).catch(() => { });
    }
    fileTmpDirs = [];
});

runFileOperationTests('MemoryStorageAdapter', async () => {
    return new MemoryStorageAdapter();
});

runFileOperationTests('JsonFileStorageAdapter (directory mode)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'json-fileops-'));
    fileTmpDirs.push(dir);
    return JsonFileStorageAdapter.create(dir, { directoryMode: true });
});

runFileOperationTests('YamlFileStorageAdapter (directory mode)', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'yaml-fileops-'));
    fileTmpDirs.push(dir);
    return YamlFileStorageAdapter.create(dir, { directoryMode: true });
});

// ─── Mixed Mode Reading Tests ───────────────────────────────────────────────

describe('Mixed mode reading', () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await mkdtemp(join(tmpdir(), 'mixed-'));
    });

    afterEach(async () => {
        await rm(tmpDir, { recursive: true });
    });

    it('JSON adapter should read both flat and directory entries', async () => {
        // Write a minion in flat mode
        const flatAdapter = await JsonFileStorageAdapter.create(tmpDir);
        const flatMinion = makeNote('FlatEntry', 'flat content');
        await flatAdapter.set(flatMinion);

        // Write another in directory mode
        const dirAdapter = await JsonFileStorageAdapter.create(tmpDir, { directoryMode: true });
        const dirMinion = makeNote('DirEntry', 'dir content');
        await dirAdapter.set(dirMinion);

        // A new adapter (either mode) should find both
        const reader = await JsonFileStorageAdapter.create(tmpDir);
        const all = await reader.list();
        const titles = all.map(m => m.title).sort();
        expect(titles).toContain('FlatEntry');
        expect(titles).toContain('DirEntry');
    });

    it('YAML adapter should read both flat and directory entries', async () => {
        const flatAdapter = await YamlFileStorageAdapter.create(tmpDir);
        const flatMinion = makeNote('FlatYaml', 'flat');
        await flatAdapter.set(flatMinion);

        const dirAdapter = await YamlFileStorageAdapter.create(tmpDir, { directoryMode: true });
        const dirMinion = makeNote('DirYaml', 'dir');
        await dirAdapter.set(dirMinion);

        const reader = await YamlFileStorageAdapter.create(tmpDir);
        const all = await reader.list();
        const titles = all.map(m => m.title).sort();
        expect(titles).toContain('FlatYaml');
        expect(titles).toContain('DirYaml');
    });
});
