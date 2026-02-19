---
title: API Reference
description: Complete API reference for the minions-core library.
---

All public exports from `minions-core`. The library is framework-agnostic, storage-agnostic, and has zero runtime dependencies.

```typescript
import {
  // Types
  type FieldType, type FieldValidation, type FieldDefinition,
  type RelationType, type MinionStatus, type MinionPriority,
  type Minion, type MinionType, type Relation,
  type CreateMinionInput, type UpdateMinionInput, type CreateRelationInput,
  type ExecutionResult, type Executable,
  type ValidationError, type ValidationResult,

  // Validation
  validateField, validateFields,

  // Schemas
  noteType, linkType, fileType, contactType,
  agentType, teamType, thoughtType, promptTemplateType, testCaseType, taskType,
  builtinTypes,

  // Registry
  TypeRegistry,

  // Relations
  RelationGraph,

  // Lifecycle
  createMinion, updateMinion, softDelete, hardDelete, restoreMinion,

  // Evolution
  migrateMinion,

  // Utilities
  generateId, now, SPEC_VERSION,
} from 'minions-core';
```

---

## Validation

### `validateField(value, field)`

Validate a single field value against its `FieldDefinition`.

```typescript
function validateField(value: unknown, field: FieldDefinition): ValidationError[]
```

Returns an array of `ValidationError` objects. Empty array means valid.

**Rules:**
- If `required` is true and the value is `undefined | null | ""`, validation fails immediately.
- If the value is absent and not required, no further checks are performed.
- Otherwise, type-specific validation is applied (see [Field Types](/reference/field-types/)).

### `validateFields(fields, schema)`

Validate all fields of a minion against a `MinionType` schema.

```typescript
function validateFields(
  fields: Record<string, unknown>,
  schema: FieldDefinition[]
): ValidationResult
```

Returns `{ valid: boolean, errors: ValidationError[] }`.

---

## Schemas

### Built-in Type Constants

Pre-defined `MinionType` objects for all built-in types:

| Export | Slug | Layer |
|--------|------|-------|
| `noteType` | `note` | — |
| `linkType` | `link` | — |
| `fileType` | `file` | — |
| `contactType` | `contact` | — |
| `agentType` | `agent` | Definition |
| `teamType` | `team` | Organization |
| `thoughtType` | `thought` | Memory |
| `promptTemplateType` | `prompt-template` | Interface |
| `testCaseType` | `test-case` | Evaluation |
| `taskType` | `task` | Execution |

### `builtinTypes`

```typescript
const builtinTypes: MinionType[]
```

Array containing all 10 built-in types.

---

## TypeRegistry

An in-memory registry for `MinionType` objects. Pre-loaded with all built-in types by default.

### Constructor

```typescript
new TypeRegistry(loadBuiltins?: boolean)
```

- `loadBuiltins` (default: `true`) — whether to pre-register built-in types.

### `register(type)`

```typescript
register(type: MinionType): void
```

Register a custom type. Throws if a type with the same `id` or `slug` already exists.

### `getById(id)`

```typescript
getById(id: string): MinionType | undefined
```

### `getBySlug(slug)`

```typescript
getBySlug(slug: string): MinionType | undefined
```

### `list()`

```typescript
list(): MinionType[]
```

Returns all registered types.

### `has(id)`

```typescript
has(id: string): boolean
```

### `remove(id)`

```typescript
remove(id: string): boolean
```

---

## RelationGraph

In-memory relation graph manager. Provides utilities to add, remove, query, and traverse typed relations between minions.

### Constructor

```typescript
new RelationGraph()
```

### `add(input)`

```typescript
add(input: CreateRelationInput): Relation
```

Creates and stores a new relation. Generates `id` and `createdAt` automatically.

### `remove(id)`

```typescript
remove(id: string): boolean
```

### `removeByMinionId(minionId)`

```typescript
removeByMinionId(minionId: string): number
```

Removes all relations where the minion is source **or** target. Returns the count of removed relations.

### `get(id)`

```typescript
get(id: string): Relation | undefined
```

### `list()`

```typescript
list(): Relation[]
```

### `getFromSource(sourceId, type?)`

```typescript
getFromSource(sourceId: string, type?: RelationType): Relation[]
```

### `getToTarget(targetId, type?)`

```typescript
getToTarget(targetId: string, type?: RelationType): Relation[]
```

### `getChildren(parentId)`

```typescript
getChildren(parentId: string): string[]
```

Returns target IDs of all `parent_of` relations from this minion.

### `getParents(childId)`

```typescript
getParents(childId: string): string[]
```

Returns source IDs of all `parent_of` relations to this minion.

### `getTree(rootId)`

```typescript
getTree(rootId: string): string[]
```

Depth-first traversal of all descendants via `parent_of` relations. Returns a flat array of descendant IDs. Handles cycles.

### `getNetwork(minionId)`

```typescript
getNetwork(minionId: string): string[]
```

All minions connected to this minion, regardless of direction or relation type.

---

## Lifecycle

### `createMinion(input, type)`

```typescript
function createMinion(
  input: CreateMinionInput,
  type: MinionType
): { minion: Minion; validation: ValidationResult }
```

Creates a new `Minion` instance:
- Generates `id` (UUID v4), `createdAt`/`updatedAt` timestamps, and `minionTypeId` (from `type.id`)
- Applies default values from the schema
- Validates fields against the type schema
- Computes `searchableText`
- Sets `status` to `"active"` if not specified

### `updateMinion(minion, input, type)`

```typescript
function updateMinion(
  minion: Minion,
  input: UpdateMinionInput,
  type: MinionType
): { minion: Minion; validation: ValidationResult }
```

Merges input into existing minion:
- Merges `fields` (strips `undefined` values)
- Updates `updatedAt` timestamp
- Re-validates and re-computes `searchableText`

### `softDelete(minion, deletedBy?)`

```typescript
function softDelete(minion: Minion, deletedBy?: string): Minion
```

Sets `deletedAt` and `deletedBy`. Relations are preserved.

### `hardDelete(minion, graph)`

```typescript
function hardDelete(minion: Minion, graph: RelationGraph): void
```

Removes all relations involving this minion from the graph.

> **Note:** `hardDelete` handles **relation cleanup only** (this is intentional — Minions is storage-agnostic). After calling it, **you must also remove the minion object from your storage layer** (array, database, etc.).

```typescript
hardDelete(myMinion, graph);        // clean up relations
myMinionStore.delete(myMinion.id);  // then remove from your storage
```

### `restoreMinion(minion)`

```typescript
function restoreMinion(minion: Minion): Minion
```

Clears `deletedAt` and `deletedBy` (sets to `null`).

---

## Evolution

### `migrateMinion(minion, oldSchema, newSchema)`

```typescript
function migrateMinion(
  minion: Minion,
  oldSchema: FieldDefinition[],
  newSchema: FieldDefinition[]
): Minion
```

Migrates a minion when its type schema changes:

| Change | Behavior |
|--------|----------|
| Field removed | Value moves to `_legacy` |
| Field type changed (incompatible) | Value moves to `_legacy` |
| Field added | Gets default value or remains absent |
| `updatedAt` | Always updated |

---

## Utilities

### `generateId()`

```typescript
function generateId(): string
```

Returns a new UUID v4 string.

### `now()`

```typescript
function now(): string
```

Returns the current time as an ISO 8601 string.

### `SPEC_VERSION`

```typescript
const SPEC_VERSION: string
```

Current specification version (derived from `package.json`).

---

## Types

### Core Primitives

| Type | Description |
|------|-------------|
| `Minion` | A structured object instance |
| `MinionType` | Schema/definition of a kind of minion |
| `Relation` | Typed directional link between two minions |

### Input Types

| Type | Description |
|------|-------------|
| `CreateMinionInput` | Input for `createMinion` (`id` and timestamps are generated; pass the `MinionType` as the second argument) |
| `UpdateMinionInput` | Input for `updateMinion` (all fields optional) |
| `CreateRelationInput` | Input for `RelationGraph.add` |

### Enums

| Type | Values |
|------|--------|
| `FieldType` | `string`, `number`, `boolean`, `date`, `select`, `multi-select`, `url`, `email`, `textarea`, `tags`, `json`, `array` |
| `RelationType` | `parent_of`, `depends_on`, `implements`, `relates_to`, `inspired_by`, `triggers`, `references`, `blocks`, `alternative_to`, `part_of`, `follows`, `integration_link` |
| `MinionStatus` | `active`, `todo`, `in_progress`, `completed`, `cancelled` |
| `MinionPriority` | `low`, `medium`, `high`, `urgent` |

### Execution Contract

| Type | Description |
|------|-------------|
| `Executable` | Interface with `execute(input) → Promise<ExecutionResult>` |
| `ExecutionResult` | `{ output, status, startedAt, completedAt, error?, metadata? }` |

### Validation

| Type | Description |
|------|-------------|
| `ValidationError` | `{ field: string, message: string, value?: unknown }` |
| `ValidationResult` | `{ valid: boolean, errors: ValidationError[] }` |
| `FieldValidation` | `{ minLength?, maxLength?, min?, max?, pattern? }` |
| `FieldDefinition` | `{ name, type, label?, description?, required?, defaultValue?, options?, validation? }` |
