/**
 * @module minions-sdk/evolution
 * Schema evolution utilities — migrate minions when their type schema changes.
 */

import type { Minion, FieldDefinition } from '../types/index.js';
import { now } from '../utils.js';

/**
 * Migrate a minion from an old schema to a new schema.
 *
 * Rules:
 * - Fields added in new schema: get default value or remain absent
 * - Fields removed from schema: values move to `_legacy`
 * - Fields whose type changed: if value doesn't match new type, move to `_legacy`
 * - Fields made required: if missing, minion is flagged (via validation)
 *
 * @param minion - The minion to migrate
 * @param oldSchema - The previous field definitions
 * @param newSchema - The new field definitions
 * @returns The migrated minion
 */
export function migrateMinion(
  minion: Minion,
  oldSchema: FieldDefinition[],
  newSchema: FieldDefinition[],
): Minion {
  const newFieldNames = new Set(newSchema.map((f) => f.name));
  const newFieldMap = new Map(newSchema.map((f) => [f.name, f]));
  const oldFieldMap = new Map(oldSchema.map((f) => [f.name, f]));

  const migratedFields: Record<string, unknown> = {};
  const legacy: Record<string, unknown> = { ...(minion._legacy ?? {}) };

  // Process existing field values
  for (const [key, value] of Object.entries(minion.fields)) {
    if (!newFieldNames.has(key)) {
      // Field removed — move to legacy
      legacy[key] = value;
    } else {
      const newDef = newFieldMap.get(key)!;
      const oldDef = oldFieldMap.get(key);

      if (oldDef && oldDef.type !== newDef.type && !isCompatibleValue(value, newDef.type)) {
        // Type changed and value incompatible — move to legacy
        legacy[key] = value;
      } else {
        // Field still exists with compatible value — keep it
        migratedFields[key] = value;
      }
    }
  }

  // Apply defaults for newly added fields
  for (const fieldDef of newSchema) {
    if (migratedFields[fieldDef.name] === undefined && fieldDef.defaultValue !== undefined) {
      migratedFields[fieldDef.name] = fieldDef.defaultValue;
    }
  }

  return {
    ...minion,
    fields: migratedFields,
    _legacy: Object.keys(legacy).length > 0 ? legacy : undefined,
    updatedAt: now(),
  };
}

/**
 * Basic check if a value is compatible with a target field type.
 */
function isCompatibleValue(value: unknown, targetType: string): boolean {
  if (value === null || value === undefined) return true;

  switch (targetType) {
    case 'string':
    case 'textarea':
    case 'url':
    case 'email':
    case 'date':
    case 'select':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'tags':
    case 'multi-select':
    case 'array':
      return Array.isArray(value);
    case 'json':
      return true; // JSON accepts anything
    default:
      return true;
  }
}
