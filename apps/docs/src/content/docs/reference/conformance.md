---
title: Conformance
description: What implementations must support to be Minions-compliant.
---

An implementation is conformant with the Minions Specification v0.1 if it meets the following requirements.

## Required (Level 1)

1. ✅ Implements all three core primitives (Minion, MinionType, Relation)
2. ✅ Supports all 12 field types with proper validation
3. ✅ Supports all 12 relation types
4. ✅ Implements the complete lifecycle (create, update, soft delete, restore, hard delete)
5. ✅ Validates minion fields against their type schema on create and update
6. ✅ Supports the four built-in types (note, link, file, contact)
7. ✅ Preserves legacy field values on schema evolution
8. ✅ Generates valid UUIDs for all IDs
9. ✅ Uses ISO 8601 for all timestamps
10. ✅ Removes relations on hard delete of a minion

## Recommended (Level 2)

- Schema migration via `migrateMinion`
- Default value application
- Layer types (agent, team, thought)

## Optional (Level 3)

- Execution contract implementation
- Task management with status tracking

## Testing

Use `minions-sdk` to verify your implementation:

```typescript
import { TypeRegistry, validateFields, createMinion } from 'minions-sdk';

const registry = new TypeRegistry();
assert(registry.list().length >= 4);

const noteType = registry.getBySlug('note')!;
const result = validateFields({ content: 'test' }, noteType.schema);
assert(result.valid === true);
```

See the full [Specification v0.1](https://github.com/mxn2020/minions/blob/main/spec/v0.1.md) for details.
