---
title: Field Types
description: All supported field types in the Minions system.
---

Minions supports 12 field types. Each type maps to a JSON Schema representation and has specific validation rules.

## Type Reference

| Type | JS Type | Description |
|------|---------|-------------|
| `string` | `string` | Short text value |
| `number` | `number` | Numeric value |
| `boolean` | `boolean` | True or false |
| `date` | `string` | ISO 8601 date-time string |
| `select` | `string` | Single choice from options |
| `multi-select` | `string[]` | Multiple choices from options |
| `url` | `string` | HTTP/HTTPS URL |
| `email` | `string` | Email address |
| `textarea` | `string` | Long-form text |
| `tags` | `string[]` | Array of string tags |
| `json` | `any` | Free-form JSON value |
| `array` | `any[]` | Generic array |

## Validation Constraints

Fields can specify additional constraints via the `validation` property:

| Constraint | Applies To | Description |
|-----------|-----------|-------------|
| `minLength` | string, textarea | Minimum character count |
| `maxLength` | string, textarea | Maximum character count |
| `pattern` | string, textarea | Regex pattern to match |
| `min` | number | Minimum value |
| `max` | number | Maximum value |

## Field Definition

```typescript
interface FieldDefinition {
  name: string;         // Field key (required)
  type: FieldType;      // One of the 12 types (required)
  label?: string;       // Display label
  description?: string; // Help text
  required?: boolean;   // Default: false
  defaultValue?: any;   // Applied on creation
  options?: string[];   // For select/multi-select
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
}
```

## Examples

### String with constraints

```typescript
{ name: 'code', type: 'string', validation: { minLength: 2, maxLength: 10, pattern: '^[A-Z]+$' } }
```

### Select with options

```typescript
{ name: 'strategy', type: 'select', options: ['round_robin', 'parallel', 'sequential'] }
```

### Number with range

```typescript
{ name: 'temperature', type: 'number', validation: { min: 0, max: 2 } }
```
