/**
 * @module minions-core/relations
 * Relation graph utilities — manage typed links between minions.
 */

import type { Relation, RelationType, CreateRelationInput } from '../types/index.js';
import { generateId, now } from '../utils.js';

/**
 * In-memory relation graph manager.
 * Provides utilities to add, remove, query, and traverse relations.
 */
export class RelationGraph {
  private relations: Map<string, Relation> = new Map();

  /**
   * Add a relation to the graph.
   * @returns The created Relation.
   */
  add(input: CreateRelationInput): Relation {
    const relation: Relation = {
      id: generateId(),
      sourceId: input.sourceId,
      targetId: input.targetId,
      type: input.type,
      createdAt: now(),
      metadata: input.metadata,
      createdBy: input.createdBy,
    };
    this.relations.set(relation.id, relation);
    return relation;
  }

  /**
   * Remove a relation by ID.
   * @returns true if the relation was removed.
   */
  remove(id: string): boolean {
    return this.relations.delete(id);
  }

  /**
   * Remove all relations involving a given minion (as source or target).
   * @returns Number of relations removed.
   */
  removeByMinionId(minionId: string): number {
    let count = 0;
    for (const [id, rel] of this.relations) {
      if (rel.sourceId === minionId || rel.targetId === minionId) {
        this.relations.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Get a relation by ID.
   */
  get(id: string): Relation | undefined {
    return this.relations.get(id);
  }

  /**
   * Get all relations.
   */
  list(): Relation[] {
    return Array.from(this.relations.values());
  }

  /**
   * Get all relations where the given minion is the source.
   */
  getFromSource(sourceId: string, type?: RelationType): Relation[] {
    return this.list().filter(
      (r) => r.sourceId === sourceId && (type === undefined || r.type === type),
    );
  }

  /**
   * Get all relations where the given minion is the target.
   */
  getToTarget(targetId: string, type?: RelationType): Relation[] {
    return this.list().filter(
      (r) => r.targetId === targetId && (type === undefined || r.type === type),
    );
  }

  /**
   * Get children of a minion (targets of parent_of relations from this minion).
   */
  getChildren(parentId: string): string[] {
    return this.getFromSource(parentId, 'parent_of').map((r) => r.targetId);
  }

  /**
   * Get parents of a minion (sources of parent_of relations to this minion).
   */
  getParents(childId: string): string[] {
    return this.getToTarget(childId, 'parent_of').map((r) => r.sourceId);
  }

  /**
   * Get the full tree of descendants from a root minion using parent_of relations.
   * Returns a flat array of all descendant IDs (depth-first).
   */
  getTree(rootId: string): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const stack = [rootId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      const children = this.getChildren(current);
      result.push(...children);
      stack.push(...children);
    }

    return result;
  }

  /**
   * Get all minions connected to the given minion (regardless of direction or type).
   * Returns a flat array of connected minion IDs.
   */
  getNetwork(minionId: string): string[] {
    const connected = new Set<string>();
    for (const rel of this.relations.values()) {
      if (rel.sourceId === minionId) connected.add(rel.targetId);
      if (rel.targetId === minionId) connected.add(rel.sourceId);
    }
    return Array.from(connected);
  }
}
