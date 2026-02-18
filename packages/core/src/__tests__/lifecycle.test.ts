import { describe, it, expect } from 'vitest';
import { createMinion, updateMinion, softDelete, restoreMinion } from '../lifecycle/index.js';
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
