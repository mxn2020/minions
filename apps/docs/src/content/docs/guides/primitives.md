---
title: Core Primitives
description: The three building blocks of the Minions system.
---

Everything in Minions is built from three primitives:

## Minion

A **Minion** is a structured object instance — the fundamental unit of the system. Every minion has a type, a title, and a set of validated fields.

```json
{
  "id": "abc-123",
  "title": "Research Assistant",
  "minionTypeId": "builtin-agent",
  "fields": {
    "role": "researcher",
    "model": "gpt-4"
  },
  "status": "active",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### Required Fields

| Field | Description |
|-------|-------------|
| `id` | UUID v4 identifier |
| `title` | Human-readable name |
| `minionTypeId` | Reference to the type |
| `fields` | Dynamic field values |
| `createdAt` | Creation timestamp |
| `updatedAt` | Last update timestamp |

### Optional Fields

Status (`active`, `todo`, `in_progress`, `completed`, `cancelled`), priority (`low`, `medium`, `high`, `urgent`), description, tags, dueDate, and more.

## MinionType

A **MinionType** defines the schema for a kind of minion. It specifies what fields are available, their types, and validation rules.

```typescript
const agentType = {
  id: 'builtin-agent',
  name: 'Agent',
  slug: 'agent',
  schema: [
    { name: 'role', type: 'string', label: 'Role' },
    { name: 'model', type: 'string', label: 'Model' },
    { name: 'tools', type: 'tags', label: 'Tools' },
  ],
};
```

Built-in types include: `note`, `link`, `file`, `contact`, `agent`, `team`, `thought`, `prompt-template`, `test-case`, `task`.

## Relation

A **Relation** is a typed, directional link between two minions. Relations create structure — hierarchies, dependencies, sequences.

```typescript
{
  sourceId: 'agent-001',
  targetId: 'skill-001',
  type: 'parent_of',
}
```

Supported types: `parent_of`, `depends_on`, `implements`, `relates_to`, `inspired_by`, `triggers`, `references`, `blocks`, `alternative_to`, `part_of`, `follows`, `integration_link`.
