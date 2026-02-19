---
title: Lifecycle
description: How minions are created, updated, deleted, and restored.
---

## Creation

When you create a minion:

1. A UUID v4 `id` is generated
2. `createdAt` and `updatedAt` are set to the current time
3. Fields are validated against the MinionType schema
4. Default values from the schema are applied
5. `status` defaults to `"active"` if not specified

```typescript
import { createMinion } from '@minions/core';

const { minion, validation } = createMinion({
  title: 'My Note',
  fields: { content: 'Hello world' },
}, noteType);

if (!validation.valid) {
  console.error(validation.errors);
}
```

## Update

Updates merge new field values with existing ones. `updatedAt` is refreshed.

```typescript
import { updateMinion } from '@minions/core';

const { minion: updated } = updateMinion(existing, {
  fields: { content: 'Updated content' },
}, noteType);
```

## Soft Delete

Soft delete marks a minion as deleted without removing it. Relations are preserved.

```typescript
import { softDelete } from '@minions/core';

const deleted = softDelete(minion, 'user-123');
// deleted.deletedAt is set
// deleted.deletedBy is 'user-123'
```

## Restore

Restoring clears the deletion markers.

```typescript
import { restoreMinion } from '@minions/core';

const restored = restoreMinion(deleted);
// restored.deletedAt is null
```

## Hard Delete

Hard delete permanently removes the minion. All relations involving it must also be removed.

```typescript
// Implementation-specific — remove from storage
// Then clean up relations:
graph.removeByMinionId(minionId);
```
