import { describe, it, expect } from 'vitest';
import { validateField, validateFields } from '../validation/index.js';
import type { FieldDefinition } from '../types/index.js';

describe('validateField', () => {
  it('should pass for valid required string', () => {
    const field: FieldDefinition = { name: 'name', type: 'string', required: true };
    const errors = validateField('hello', field);
    expect(errors).toHaveLength(0);
  });

  it('should fail for missing required field', () => {
    const field: FieldDefinition = { name: 'name', type: 'string', required: true };
    const errors = validateField(undefined, field);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('required');
  });

  it('should pass for missing optional field', () => {
    const field: FieldDefinition = { name: 'name', type: 'string' };
    const errors = validateField(undefined, field);
    expect(errors).toHaveLength(0);
  });

  it('should validate number type', () => {
    const field: FieldDefinition = { name: 'age', type: 'number' };
    expect(validateField(42, field)).toHaveLength(0);
    expect(validateField('not a number', field)).toHaveLength(1);
  });

  it('should validate number min/max', () => {
    const field: FieldDefinition = { name: 'temp', type: 'number', validation: { min: 0, max: 2 } };
    expect(validateField(1, field)).toHaveLength(0);
    expect(validateField(-1, field)).toHaveLength(1);
    expect(validateField(3, field)).toHaveLength(1);
  });

  it('should validate boolean type', () => {
    const field: FieldDefinition = { name: 'active', type: 'boolean' };
    expect(validateField(true, field)).toHaveLength(0);
    expect(validateField('yes', field)).toHaveLength(1);
  });

  it('should validate date type', () => {
    const field: FieldDefinition = { name: 'date', type: 'date' };
    expect(validateField('2024-01-01T00:00:00Z', field)).toHaveLength(0);
    expect(validateField('2024-01-01', field)).toHaveLength(0);
    expect(validateField('2024-06-15T14:30:00+02:00', field)).toHaveLength(0);
    expect(validateField('not-a-date', field)).toHaveLength(1);
    expect(validateField('2024', field)).toHaveLength(1); // lenient Date.parse would accept this
    expect(validateField('banana 2024', field)).toHaveLength(1);
  });

  it('should validate select type with options', () => {
    const field: FieldDefinition = { name: 'color', type: 'select', options: ['red', 'blue'] };
    expect(validateField('red', field)).toHaveLength(0);
    expect(validateField('green', field)).toHaveLength(1);
  });

  it('should validate multi-select type', () => {
    const field: FieldDefinition = { name: 'colors', type: 'multi-select', options: ['red', 'blue'] };
    expect(validateField(['red'], field)).toHaveLength(0);
    expect(validateField(['green'], field)).toHaveLength(1);
    expect(validateField('not-array', field)).toHaveLength(1);
  });

  it('should validate url type', () => {
    const field: FieldDefinition = { name: 'site', type: 'url' };
    expect(validateField('https://example.com', field)).toHaveLength(0);
    expect(validateField('http://example.com/path?q=1', field)).toHaveLength(0);
    expect(validateField('not-a-url', field)).toHaveLength(1);
    expect(validateField('https://', field)).toHaveLength(1); // empty host
    expect(validateField('ftp://example.com', field)).toHaveLength(1); // wrong protocol
  });

  it('should validate email type', () => {
    const field: FieldDefinition = { name: 'email', type: 'email' };
    expect(validateField('test@example.com', field)).toHaveLength(0);
    expect(validateField('not-email', field)).toHaveLength(1);
  });

  it('should validate tags type', () => {
    const field: FieldDefinition = { name: 'tags', type: 'tags' };
    expect(validateField(['a', 'b'], field)).toHaveLength(0);
    expect(validateField('not-array', field)).toHaveLength(1);
    expect(validateField([1, 2], field)).toHaveLength(2);
  });

  it('should validate textarea type', () => {
    const field: FieldDefinition = { name: 'content', type: 'textarea' };
    expect(validateField('long text here', field)).toHaveLength(0);
    expect(validateField(123, field)).toHaveLength(1);
  });

  it('should validate json type', () => {
    const field: FieldDefinition = { name: 'data', type: 'json' };
    expect(validateField({ key: 'value' }, field)).toHaveLength(0);
    expect(validateField([1, 2], field)).toHaveLength(0);
  });

  it('should validate array type', () => {
    const field: FieldDefinition = { name: 'items', type: 'array' };
    expect(validateField([1, 2, 3], field)).toHaveLength(0);
    expect(validateField('not-array', field)).toHaveLength(1);
  });

  it('should validate string constraints', () => {
    const field: FieldDefinition = {
      name: 'code',
      type: 'string',
      validation: { minLength: 2, maxLength: 5 },
    };
    expect(validateField('abc', field)).toHaveLength(0);
    expect(validateField('a', field)).toHaveLength(1);
    expect(validateField('abcdef', field)).toHaveLength(1);
  });

  it('should validate string pattern constraint', () => {
    const field: FieldDefinition = {
      name: 'code',
      type: 'string',
      validation: { pattern: '^[A-Z]{3}-\\d{3}$' },
    };
    expect(validateField('ABC-123', field)).toHaveLength(0);
    expect(validateField('abc-123', field)).toHaveLength(1);
    expect(validateField('ABCD-1234', field)).toHaveLength(1);
  });
});

describe('validateFields', () => {
  it('should validate all fields in a schema', () => {
    const schema: FieldDefinition[] = [
      { name: 'content', type: 'textarea', required: true },
    ];
    const result = validateFields({ content: 'hello' }, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should collect all errors', () => {
    const schema: FieldDefinition[] = [
      { name: 'name', type: 'string', required: true },
      { name: 'email', type: 'email', required: true },
    ];
    const result = validateFields({}, schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});
