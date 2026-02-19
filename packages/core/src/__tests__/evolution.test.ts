import { describe, it, expect } from 'vitest';
import { migrateMinion } from '../evolution/index.js';
import type { Minion, FieldDefinition } from '../types/index.js';

describe('migrateMinion', () => {
  const baseMinion: Minion = {
    id: 'test-1',
    title: 'Test',
    minionTypeId: 'type-1',
    fields: { name: 'Alice', age: 30 },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const oldSchema: FieldDefinition[] = [
    { name: 'name', type: 'string' },
    { name: 'age', type: 'number' },
  ];

  it('should keep fields that still exist', () => {
    const newSchema: FieldDefinition[] = [
      { name: 'name', type: 'string' },
      { name: 'age', type: 'number' },
    ];
    const migrated = migrateMinion(baseMinion, oldSchema, newSchema);
    expect(migrated.fields.name).toBe('Alice');
    expect(migrated.fields.age).toBe(30);
  });

  it('should move removed fields to _legacy', () => {
    const newSchema: FieldDefinition[] = [
      { name: 'name', type: 'string' },
    ];
    const migrated = migrateMinion(baseMinion, oldSchema, newSchema);
    expect(migrated.fields.age).toBeUndefined();
    expect(migrated._legacy?.age).toBe(30);
  });

  it('should move incompatible type-changed fields to _legacy', () => {
    const newSchema: FieldDefinition[] = [
      { name: 'name', type: 'number' }, // was string, value is string — incompatible
      { name: 'age', type: 'number' },
    ];
    const migrated = migrateMinion(baseMinion, oldSchema, newSchema);
    expect(migrated._legacy?.name).toBe('Alice');
    expect(migrated.fields.name).toBeUndefined();
  });

  it('should apply defaults for new fields', () => {
    const newSchema: FieldDefinition[] = [
      { name: 'name', type: 'string' },
      { name: 'age', type: 'number' },
      { name: 'role', type: 'string', defaultValue: 'user' },
    ];
    const migrated = migrateMinion(baseMinion, oldSchema, newSchema);
    expect(migrated.fields.role).toBe('user');
  });

  it('should not have _legacy when no fields were moved', () => {
    const newSchema: FieldDefinition[] = [
      { name: 'name', type: 'string' },
      { name: 'age', type: 'number' },
    ];
    const migrated = migrateMinion(baseMinion, oldSchema, newSchema);
    expect(migrated._legacy).toBeUndefined();
  });

  it('should accumulate _legacy values from previous migrations', () => {
    const minionWithLegacy: Minion = {
      ...baseMinion,
      fields: { name: 'Alice', age: 30 },
      _legacy: { oldField: 'preserved' },
    };
    const newSchema: FieldDefinition[] = [
      { name: 'name', type: 'string' },
      // age removed — should join existing _legacy
    ];
    const migrated = migrateMinion(minionWithLegacy, oldSchema, newSchema);
    expect(migrated._legacy?.oldField).toBe('preserved');
    expect(migrated._legacy?.age).toBe(30);
  });
});
