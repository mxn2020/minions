---
title: Schema Evolution
description: How minions adapt when their type schema changes.
---

Schemas change over time. Minions handles this gracefully by preserving old data.

## Migration Rules

| Change | What Happens |
|--------|-------------|
| Field added | Existing minions get the default value (or nothing) |
| Field removed | Old values move to `_legacy` |
| Field type changed | Incompatible values move to `_legacy` |
| Field made required | Existing minions are flagged for migration |
| Validation changed | Old values are NOT retroactively validated |

## Using migrateMinion

```typescript
import { migrateMinion } from 'minions-sdk';

const oldSchema = [
  { name: 'name', type: 'string' },
  { name: 'age', type: 'number' },
];

const newSchema = [
  { name: 'name', type: 'string' },
  { name: 'role', type: 'string', defaultValue: 'user' },
  // 'age' removed
];

const migrated = migrateMinion(myMinion, oldSchema, newSchema);
// migrated.fields.role === 'user' (default applied)
// migrated._legacy.age === 30 (preserved from old data)
```

## The _legacy Namespace

When fields are removed or become incompatible, their values are preserved in `_legacy`. This ensures no data is silently lost during schema changes.

```json
{
  "fields": { "name": "Alice", "role": "user" },
  "_legacy": { "age": 30 }
}
```
