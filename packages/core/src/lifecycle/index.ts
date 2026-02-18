/**
 * @module @minions/core/lifecycle
 * Minion lifecycle utilities — create, update, soft delete, restore.
 */

import type {
  Minion,
  CreateMinionInput,
  UpdateMinionInput,
  MinionType,
  ValidationResult,
} from '../types/index.js';
import { validateFields } from '../validation/index.js';
import { generateId, now } from '../utils.js';

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
  const fields = { ...minion.fields, ...(input.fields ?? {}) };
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

  return { minion: updated, validation };
}

/**
 * Soft-delete a minion by setting deletedAt/deletedBy.
 * @param minion - The minion to soft-delete
 * @param deletedBy - Optional identifier of who deleted it
 * @returns The soft-deleted minion
 */
export function softDelete(minion: Minion, deletedBy?: string): Minion {
  return {
    ...minion,
    deletedAt: now(),
    deletedBy: deletedBy ?? null,
    updatedAt: now(),
  };
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
