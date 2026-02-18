import { describe, it, expect } from 'vitest';
import { TypeRegistry } from '../registry/index.js';
import { builtinTypes, noteType } from '../schemas/index.js';

describe('TypeRegistry', () => {
  it('should load builtin types by default', () => {
    const registry = new TypeRegistry();
    expect(registry.list().length).toBe(builtinTypes.length);
  });

  it('should skip builtins when told', () => {
    const registry = new TypeRegistry(false);
    expect(registry.list().length).toBe(0);
  });

  it('should get type by id', () => {
    const registry = new TypeRegistry();
    const note = registry.getById('builtin-note');
    expect(note).toBeDefined();
    expect(note!.slug).toBe('note');
  });

  it('should get type by slug', () => {
    const registry = new TypeRegistry();
    const agent = registry.getBySlug('agent');
    expect(agent).toBeDefined();
    expect(agent!.id).toBe('builtin-agent');
  });

  it('should register custom types', () => {
    const registry = new TypeRegistry();
    registry.register({
      id: 'custom-1',
      name: 'Custom',
      slug: 'custom',
      schema: [],
    });
    expect(registry.getBySlug('custom')).toBeDefined();
  });

  it('should throw on duplicate id', () => {
    const registry = new TypeRegistry();
    expect(() => registry.register(noteType)).toThrow('already registered');
  });

  it('should throw on duplicate slug', () => {
    const registry = new TypeRegistry();
    expect(() => registry.register({ ...noteType, id: 'different-id' })).toThrow('already registered');
  });

  it('should remove types', () => {
    const registry = new TypeRegistry();
    expect(registry.remove('builtin-note')).toBe(true);
    expect(registry.getById('builtin-note')).toBeUndefined();
    expect(registry.getBySlug('note')).toBeUndefined();
  });

  it('should return false when removing non-existent type', () => {
    const registry = new TypeRegistry();
    expect(registry.remove('nonexistent')).toBe(false);
  });

  it('should check existence', () => {
    const registry = new TypeRegistry();
    expect(registry.has('builtin-note')).toBe(true);
    expect(registry.has('nonexistent')).toBe(false);
  });
});
