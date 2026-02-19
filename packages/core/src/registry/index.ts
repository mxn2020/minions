/**
 * @module minions-sdk/registry
 * MinionType registry — register, retrieve, and validate types.
 */

import type { MinionType } from '../types/index.js';
import { builtinTypes } from '../schemas/index.js';

/**
 * An in-memory registry for MinionTypes.
 * Pre-loaded with all built-in system types.
 */
export class TypeRegistry {
  private types: Map<string, MinionType> = new Map();
  private slugIndex: Map<string, string> = new Map();

  constructor(loadBuiltins = true) {
    if (loadBuiltins) {
      for (const t of builtinTypes) {
        this.register(t);
      }
    }
  }

  /**
   * Register a MinionType in the registry.
   * @throws Error if a type with the same id or slug already exists.
   */
  register(type: MinionType): void {
    if (this.types.has(type.id)) {
      throw new Error(`Type with id "${type.id}" is already registered`);
    }
    if (this.slugIndex.has(type.slug)) {
      throw new Error(`Type with slug "${type.slug}" is already registered`);
    }
    this.types.set(type.id, type);
    this.slugIndex.set(type.slug, type.id);
  }

  /**
   * Get a type by its ID.
   * @returns The MinionType or undefined if not found.
   */
  getById(id: string): MinionType | undefined {
    return this.types.get(id);
  }

  /**
   * Get a type by its slug.
   * @returns The MinionType or undefined if not found.
   */
  getBySlug(slug: string): MinionType | undefined {
    const id = this.slugIndex.get(slug);
    return id ? this.types.get(id) : undefined;
  }

  /**
   * List all registered types.
   */
  list(): MinionType[] {
    return Array.from(this.types.values());
  }

  /**
   * Check if a type exists by ID.
   */
  has(id: string): boolean {
    return this.types.has(id);
  }

  /**
   * Remove a type from the registry.
   * @returns true if the type was removed.
   */
  remove(id: string): boolean {
    const type = this.types.get(id);
    if (!type) return false;
    this.types.delete(id);
    this.slugIndex.delete(type.slug);
    return true;
  }
}
