---
title: "Note"
description: "Built-in type: a simple text note."
---

The **Note** type is the simplest built-in minion type — a freeform text note.

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | `textarea` | ✅ yes | The note content |

## Metadata

| Property | Value |
|----------|-------|
| **Slug** | `note` |
| **ID** | `builtin-note` |
| **Icon** | 📝 |
| **System** | Yes |
| **Layer** | — (base type) |

## Example

```json
{
  "title": "Meeting Notes",
  "minionTypeId": "builtin-note",
  "fields": {
    "content": "Discussed Q2 roadmap priorities. Key takeaway: focus on developer experience."
  },
  "tags": ["meetings", "q2"]
}
```

## Usage

```typescript
import { TypeRegistry, createMinion } from 'minions-core';

const registry = new TypeRegistry();
const noteType = registry.getBySlug('note')!;

const { minion, validation } = createMinion({
  title: 'Quick Thought',
  fields: { content: 'This is a note.' },
}, noteType);
```
