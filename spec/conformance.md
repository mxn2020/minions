# Minions Conformance Guide

This document defines what it means for an implementation to be conformant with the Minions Specification.

## Conformance Levels

### Level 1: Core (Required)

All implementations MUST support:

1. **Three primitives**: Minion, MinionType, and Relation data structures with all required fields
2. **Field validation**: All 12 field types validated per the spec rules
3. **Relation types**: All 12 relation types stored and queryable
4. **Lifecycle**: Create, update, soft delete, restore, and hard delete operations
5. **Built-in types**: The four standard types (note, link, file, contact)
6. **Identity**: UUID v4 for all IDs, ISO 8601 for all timestamps
7. **Schema validation**: Fields validated against type schema on create and update
8. **Cascade delete**: Relations removed on hard delete of a minion

### Level 2: Evolution (Recommended)

Implementations SHOULD support:

1. **Schema migration**: `migrateMinion` function that preserves legacy field values
2. **Default values**: Applied on creation when fields are absent
3. **Layer types**: At least the `agent`, `team`, and `thought` layer types

### Level 3: Execution (Optional)

Implementations MAY support:

1. **Execution contract**: The `Executable` interface
2. **Task management**: The `task` type with execution status tracking

## Testing Conformance

Use the `minions-sdk` library's validation engine to verify your implementation:

```typescript
import { TypeRegistry, validateFields, createMinion } from 'minions-sdk';

// Verify all built-in types are available
const registry = new TypeRegistry();
const types = registry.list();
assert(types.length >= 4); // note, link, file, contact

// Verify field validation works
const noteType = registry.getBySlug('note')!;
const result = validateFields({ content: 'test' }, noteType.schema);
assert(result.valid === true);
```

---

*Minions Specification v0.1.0 — MIT*
