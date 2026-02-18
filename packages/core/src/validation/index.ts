/**
 * @module @minions/core/validation
 * Field validation engine for the Minions system.
 * Validates minion field values against their MinionType schema.
 */

import type { FieldDefinition, FieldType, ValidationError, ValidationResult } from '../types/index.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/;

/**
 * Validate a single field value against its definition.
 * @param value - The value to validate
 * @param field - The field definition to validate against
 * @returns Array of validation errors (empty if valid)
 */
export function validateField(value: unknown, field: FieldDefinition): ValidationError[] {
  const errors: ValidationError[] = [];
  const isAbsent = value === undefined || value === null || value === '';

  // Required check
  if (field.required && isAbsent) {
    errors.push({ field: field.name, message: `Field "${field.name}" is required`, value });
    return errors;
  }

  // If not present and not required, skip further validation
  if (isAbsent) return errors;

  // Type-specific validation
  const typeErrors = validateFieldType(value, field);
  errors.push(...typeErrors);

  return errors;
}

/**
 * Validate a value matches the expected field type and constraints.
 */
function validateFieldType(value: unknown, field: FieldDefinition): ValidationError[] {
  const errors: ValidationError[] = [];
  const { name, type, options, validation } = field;

  const typeValidators: Record<FieldType, () => void> = {
    string: () => {
      if (typeof value !== 'string') {
        errors.push({ field: name, message: `Expected string, got ${typeof value}`, value });
        return;
      }
      applyStringConstraints(value, name, validation, errors);
    },
    textarea: () => {
      if (typeof value !== 'string') {
        errors.push({ field: name, message: `Expected string, got ${typeof value}`, value });
        return;
      }
      applyStringConstraints(value, name, validation, errors);
    },
    number: () => {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        errors.push({ field: name, message: `Expected number, got ${typeof value}`, value });
        return;
      }
      if (validation?.min !== undefined && value < validation.min) {
        errors.push({ field: name, message: `Value must be >= ${validation.min}`, value });
      }
      if (validation?.max !== undefined && value > validation.max) {
        errors.push({ field: name, message: `Value must be <= ${validation.max}`, value });
      }
    },
    boolean: () => {
      if (typeof value !== 'boolean') {
        errors.push({ field: name, message: `Expected boolean, got ${typeof value}`, value });
      }
    },
    date: () => {
      if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
        errors.push({ field: name, message: `Expected valid ISO 8601 date string`, value });
      }
    },
    select: () => {
      if (typeof value !== 'string') {
        errors.push({ field: name, message: `Expected string for select, got ${typeof value}`, value });
        return;
      }
      if (options && !options.includes(value)) {
        errors.push({ field: name, message: `Value must be one of: ${options.join(', ')}`, value });
      }
    },
    'multi-select': () => {
      if (!Array.isArray(value)) {
        errors.push({ field: name, message: `Expected array for multi-select, got ${typeof value}`, value });
        return;
      }
      if (options) {
        for (const item of value) {
          if (!options.includes(item as string)) {
            errors.push({ field: name, message: `Invalid option: ${item}. Must be one of: ${options.join(', ')}`, value: item });
          }
        }
      }
    },
    url: () => {
      if (typeof value !== 'string' || !URL_RE.test(value)) {
        errors.push({ field: name, message: `Expected valid URL (http/https)`, value });
      }
    },
    email: () => {
      if (typeof value !== 'string' || !EMAIL_RE.test(value)) {
        errors.push({ field: name, message: `Expected valid email address`, value });
      }
    },
    tags: () => {
      if (!Array.isArray(value)) {
        errors.push({ field: name, message: `Expected array for tags, got ${typeof value}`, value });
        return;
      }
      for (const tag of value) {
        if (typeof tag !== 'string') {
          errors.push({ field: name, message: `Tag values must be strings`, value: tag });
        }
      }
    },
    json: () => {
      if (typeof value !== 'object' && typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
        errors.push({ field: name, message: `Expected valid JSON value`, value });
      }
    },
    array: () => {
      if (!Array.isArray(value)) {
        errors.push({ field: name, message: `Expected array, got ${typeof value}`, value });
      }
    },
  };

  const validator = typeValidators[type];
  if (validator) {
    validator();
  } else {
    errors.push({ field: name, message: `Unknown field type: ${type}`, value });
  }

  return errors;
}

function applyStringConstraints(
  value: string,
  fieldName: string,
  validation: FieldDefinition['validation'],
  errors: ValidationError[],
): void {
  if (!validation) return;
  if (validation.minLength !== undefined && value.length < validation.minLength) {
    errors.push({ field: fieldName, message: `Must be at least ${validation.minLength} characters`, value });
  }
  if (validation.maxLength !== undefined && value.length > validation.maxLength) {
    errors.push({ field: fieldName, message: `Must be at most ${validation.maxLength} characters`, value });
  }
  if (validation.pattern !== undefined && !new RegExp(validation.pattern).test(value)) {
    errors.push({ field: fieldName, message: `Must match pattern: ${validation.pattern}`, value });
  }
}

/**
 * Validate all fields of a minion against a MinionType schema.
 * @param fields - The minion's field values
 * @param schema - The field definitions from the MinionType
 * @returns Validation result with any errors
 */
export function validateFields(fields: Record<string, unknown>, schema: FieldDefinition[]): ValidationResult {
  const errors: ValidationError[] = [];

  for (const fieldDef of schema) {
    const value = fields[fieldDef.name];
    errors.push(...validateField(value, fieldDef));
  }

  return { valid: errors.length === 0, errors };
}
