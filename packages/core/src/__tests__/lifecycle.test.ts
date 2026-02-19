import { describe, it, expect } from 'vitest';
import { createMinion, updateMinion, softDelete, hardDelete, restoreMinion } from '../lifecycle/index.js';
import { RelationGraph } from '../relations/index.js';
import { noteType, agentType } from '../schemas/index.js';

describe('createMinion', () => {
  it('should create a valid minion', () => {
    const { minion, validation } = createMinion({
      title: 'Test Note',
      minionTypeId: noteType.id,
      fields: { content: 'Hello world' },
    }, noteType);

    expect(validation.valid).toBe(true);
    expect(minion.id).toBeDefined();
    expect(minion.title).toBe('Test Note');
    expect(minion.fields.content).toBe('Hello world');
    expect(minion.status).toBe('active');
    expect(minion.createdAt).toBeDefined();
    expect(minion.updatedAt).toBe(minion.createdAt);
  });

  it('should report validation errors', () => {
    const { validation } = createMinion({
      title: 'Bad Note',
      minionTypeId: noteType.id,
      fields: {},
    }, noteType);

    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should apply default values', () => {
    const typeWithDefaults = {
      ...noteType,
      id: 'test-defaults',
      slug: 'test-defaults',
      schema: [
        { name: 'content', type: 'textarea' as const, defaultValue: 'default content' },
      ],
    };
    const { minion } = createMinion({
      title: 'Test',
      minionTypeId: typeWithDefaults.id,
      fields: {},
    }, typeWithDefaults);

    expect(minion.fields.content).toBe('default content');
  });

  it('should set searchableText on creation', () => {
    const { minion } = createMinion({
      title: 'My Research Note',
      minionTypeId: noteType.id,
      fields: { content: 'Some important CONTENT here' },
    }, noteType);

    expect(minion.searchableText).toBeDefined();
    expect(minion.searchableText).toContain('my research note');
    expect(minion.searchableText).toContain('some important content here');
  });

  it('should include tags in searchableText', () => {
    const typeWithTags = {
      ...noteType,
      id: 'test-tags',
      slug: 'test-tags',
      schema: [
        { name: 'content', type: 'textarea' as const },
        { name: 'labels', type: 'tags' as const },
      ],
    };
    const { minion } = createMinion({
      title: 'Tagged',
      minionTypeId: typeWithTags.id,
      fields: { content: 'body', labels: ['alpha', 'beta'] },
    }, typeWithTags);

    expect(minion.searchableText).toContain('alpha beta');
  });
});

describe('updateMinion', () => {
  it('should update fields', async () => {
    const { minion } = createMinion({
      title: 'Agent',
      minionTypeId: agentType.id,
      fields: { role: 'researcher' },
    }, agentType);

    // Small delay to ensure timestamp differs
    await new Promise((r) => setTimeout(r, 10));

    const { minion: updated } = updateMinion(minion, {
      fields: { role: 'analyst' },
    }, agentType);

    expect(updated.fields.role).toBe('analyst');
    expect(updated.updatedAt).toBeDefined();
  });

  it('should update title', () => {
    const { minion } = createMinion({
      title: 'Old Title',
      minionTypeId: noteType.id,
      fields: { content: 'test' },
    }, noteType);

    const { minion: updated } = updateMinion(minion, { title: 'New Title' }, noteType);
    expect(updated.title).toBe('New Title');
  });

  it('should strip undefined field values after merge', () => {
    const { minion } = createMinion({
      title: 'Note',
      minionTypeId: noteType.id,
      fields: { content: 'hello' },
    }, noteType);

    const { minion: updated } = updateMinion(minion, {
      fields: { content: undefined as unknown as string },
    }, noteType);

    // The undefined value should be stripped, not stored
    expect(updated.fields).not.toHaveProperty('content');
    expect(Object.values(updated.fields).every((v) => v !== undefined)).toBe(true);
  });

  it('should preserve defined fields when stripping undefined', () => {
    const typeWithMultiFields = {
      ...noteType,
      id: 'test-multi',
      slug: 'test-multi',
      schema: [
        { name: 'a', type: 'string' as const },
        { name: 'b', type: 'string' as const },
      ],
    };
    const { minion } = createMinion({
      title: 'Test',
      minionTypeId: typeWithMultiFields.id,
      fields: { a: 'keep', b: 'also keep' },
    }, typeWithMultiFields);

    const { minion: updated } = updateMinion(minion, {
      fields: { a: undefined as unknown as string, b: 'updated' },
    }, typeWithMultiFields);

    expect(updated.fields).not.toHaveProperty('a');
    expect(updated.fields.b).toBe('updated');
  });

  it('should update searchableText on update', () => {
    const { minion } = createMinion({
      title: 'Original',
      minionTypeId: noteType.id,
      fields: { content: 'first version' },
    }, noteType);

    expect(minion.searchableText).toContain('first version');

    const { minion: updated } = updateMinion(minion, {
      title: 'Updated Title',
      fields: { content: 'second version' },
    }, noteType);

    expect(updated.searchableText).toContain('updated title');
    expect(updated.searchableText).toContain('second version');
    expect(updated.searchableText).not.toContain('original');
  });
});

describe('softDelete', () => {
  it('should set deletedAt', () => {
    const { minion } = createMinion({
      title: 'Note',
      minionTypeId: noteType.id,
      fields: { content: 'test' },
    }, noteType);

    const deleted = softDelete(minion, 'user-1');
    expect(deleted.deletedAt).toBeDefined();
    expect(deleted.deletedBy).toBe('user-1');
  });

  it('should use the same timestamp for deletedAt and updatedAt', () => {
    const { minion } = createMinion({
      title: 'Note',
      minionTypeId: noteType.id,
      fields: { content: 'test' },
    }, noteType);

    const deleted = softDelete(minion);
    expect(deleted.deletedAt).toBe(deleted.updatedAt);
  });
});

describe('hardDelete', () => {
  it('should remove all relations involving the minion', () => {
    const { minion: m1 } = createMinion({
      title: 'Source',
      minionTypeId: noteType.id,
      fields: { content: 'a' },
    }, noteType);

    const { minion: m2 } = createMinion({
      title: 'Target',
      minionTypeId: noteType.id,
      fields: { content: 'b' },
    }, noteType);

    const graph = new RelationGraph();
    graph.add({ sourceId: m1.id, targetId: m2.id, type: 'relates_to' });
    graph.add({ sourceId: m2.id, targetId: m1.id, type: 'depends_on' });

    expect(graph.list().length).toBe(2);

    hardDelete(m1, graph);

    // All relations involving m1 should be gone
    expect(graph.getFromSource(m1.id).length).toBe(0);
    expect(graph.getToTarget(m1.id).length).toBe(0);
    expect(graph.list().length).toBe(0);
  });

  it('should not throw when there are no relations', () => {
    const { minion } = createMinion({
      title: 'Lonely',
      minionTypeId: noteType.id,
      fields: { content: 'alone' },
    }, noteType);

    const graph = new RelationGraph();

    expect(() => hardDelete(minion, graph)).not.toThrow();
    expect(graph.list().length).toBe(0);
  });

  it('should only remove relations for the target minion, not others', () => {
    const { minion: m1 } = createMinion({
      title: 'A',
      minionTypeId: noteType.id,
      fields: { content: 'a' },
    }, noteType);

    const { minion: m2 } = createMinion({
      title: 'B',
      minionTypeId: noteType.id,
      fields: { content: 'b' },
    }, noteType);

    const { minion: m3 } = createMinion({
      title: 'C',
      minionTypeId: noteType.id,
      fields: { content: 'c' },
    }, noteType);

    const graph = new RelationGraph();
    graph.add({ sourceId: m1.id, targetId: m2.id, type: 'relates_to' });
    graph.add({ sourceId: m2.id, targetId: m3.id, type: 'parent_of' });

    hardDelete(m1, graph);

    // m1's relation should be gone, but m2→m3 should remain
    expect(graph.list().length).toBe(1);
    expect(graph.getFromSource(m2.id).length).toBe(1);
  });
});

describe('restoreMinion', () => {
  it('should clear deletedAt', () => {
    const { minion } = createMinion({
      title: 'Note',
      minionTypeId: noteType.id,
      fields: { content: 'test' },
    }, noteType);

    const deleted = softDelete(minion);
    const restored = restoreMinion(deleted);
    expect(restored.deletedAt).toBeNull();
    expect(restored.deletedBy).toBeNull();
  });
});
