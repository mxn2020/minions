/**
 * @module @minions/core/lifecycle
 * Minion lifecycle utilities — create, update, soft delete, hard delete, restore.
 */

import type {
  Minion,
  CreateMinionInput,
  UpdateMinionInput,
  MinionType,
  ValidationResult,
} from '../types/index.js';
import type { RelationGraph } from '../relations/index.js';
import { validateFields } from '../validation/index.js';
import { generateId, now } from '../utils.js';

/** Field types whose values are included in searchable text. */
const SEARCHABLE_FIELD_TYPES = new Set([
  'string',
  'textarea',
  'url',
  'email',
  'tags',
  'select',
]);

/**
 * Compute a lowercased full-text search string from a minion's title and
 * string-like field values.
 */
function computeSearchableText(minion: Minion, type: MinionType): string {
  const parts: string[] = [minion.title];

  for (const fieldDef of type.schema) {
    if (!SEARCHABLE_FIELD_TYPES.has(fieldDef.type)) continue;
    const value = minion.fields[fieldDef.name];
    if (value === undefined || value === null) continue;

    if (fieldDef.type === 'tags' && Array.isArray(value)) {
      parts.push(value.join(' '));
    } else if (typeof value === 'string') {
      parts.push(value);
    }
  }

  return parts.join(' ').toLowerCase();
}

/**
 * Strip entries whose value is `undefined` from a fields object.
 */
function stripUndefined(
  fields: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined),
  );
}

/**
 * Create a new Minion instance from input, generating id and timestamps.
 * Validates fields against the provided MinionType schema.
 * @param input - The creation input
 * @param type - The MinionType to validate against
 * @returns An object with the created minion and any validation result
 */
export function createMinion(
  input: CreateMinionInput,
  type: MinionType,
): { minion: Minion; validation: ValidationResult } {
  const fields = applyDefaults(input.fields ?? {}, type);
  const validation = validateFields(fields, type.schema);

  const timestamp = now();
  const minion: Minion = {
    id: generateId(),
    title: input.title,
    minionTypeId: input.minionTypeId,
    fields,
    createdAt: timestamp,
    updatedAt: timestamp,
    tags: input.tags,
    status: input.status ?? 'active',
    priority: input.priority,
    description: input.description,
    dueDate: input.dueDate,
    categoryId: input.categoryId,
    folderId: input.folderId,
    createdBy: input.createdBy,
  };

  minion.searchableText = computeSearchableText(minion, type);

  return { minion, validation };
}

/**
 * Update an existing Minion with new values.
 * Validates updated fields against the provided MinionType schema.
 * @param minion - The existing minion
 * @param input - The update input
 * @param type - The MinionType to validate against
 * @returns An object with the updated minion and any validation result
 */
export function updateMinion(
  minion: Minion,
  input: UpdateMinionInput,
  type: MinionType,
): { minion: Minion; validation: ValidationResult } {
  const fields = stripUndefined({ ...minion.fields, ...(input.fields ?? {}) });
  const validation = validateFields(fields, type.schema);

  const updated: Minion = {
    ...minion,
    title: input.title ?? minion.title,
    fields,
    tags: input.tags ?? minion.tags,
    status: input.status ?? minion.status,
    priority: input.priority ?? minion.priority,
    description: input.description ?? minion.description,
    dueDate: input.dueDate ?? minion.dueDate,
    categoryId: input.categoryId ?? minion.categoryId,
    folderId: input.folderId ?? minion.folderId,
    updatedAt: now(),
    updatedBy: input.updatedBy,
  };

  updated.searchableText = computeSearchableText(updated, type);

  return { minion: updated, validation };
}

/**
 * Soft-delete a minion by setting deletedAt/deletedBy.
 * @param minion - The minion to soft-delete
 * @param deletedBy - Optional identifier of who deleted it
 * @returns The soft-deleted minion
 */
export function softDelete(minion: Minion, deletedBy?: string): Minion {
  const ts = now();
  return {
    ...minion,
    deletedAt: ts,
    deletedBy: deletedBy ?? null,
    updatedAt: ts,
  };
}

/**
 * Hard-delete a minion by removing all of its relations from the graph.
 *
 * **Important:** This function only cleans up the relation graph. The caller
 * is responsible for removing the minion object itself from whatever storage
 * layer is in use (array, database, etc.).
 *
 * @param minion - The minion to hard-delete
 * @param graph - The RelationGraph to clean up
 */
export function hardDelete(minion: Minion, graph: RelationGraph): void {
  graph.removeByMinionId(minion.id);
}

/**
 * Restore a soft-deleted minion.
 * @param minion - The soft-deleted minion
 * @returns The restored minion
 */
export function restoreMinion(minion: Minion): Minion {
  return {
    ...minion,
    deletedAt: null,
    deletedBy: null,
    updatedAt: now(),
  };
}

/**
 * Apply default values from the schema to a fields object.
 */
function applyDefaults(
  fields: Record<string, unknown>,
  type: MinionType,
): Record<string, unknown> {
  const result = { ...fields };
  for (const fieldDef of type.schema) {
    if (result[fieldDef.name] === undefined && fieldDef.defaultValue !== undefined) {
      result[fieldDef.name] = fieldDef.defaultValue;
    }
  }
  return result;
}
