---
title: "Team"
description: "Organization Layer: a group of agents working together."
---

The **Team** type belongs to the **Organization Layer** — it defines how things group and relate.

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `members` | `tags` | no | Member identifiers |
| `strategy` | `select` | no | Execution strategy: `round_robin`, `parallel`, `sequential` |
| `maxConcurrency` | `number` | no | Maximum parallel execution count |

## Metadata

| Property | Value |
|----------|-------|
| **Slug** | `team` |
| **ID** | `builtin-team` |
| **Icon** | 👥 |
| **System** | Yes |
| **Layer** | Organization |
| **Organizational** | Yes |

## Example

```json
{
  "title": "Content Creation Team",
  "minionTypeId": "builtin-team",
  "fields": {
    "members": ["agent-writer-001", "agent-editor-001"],
    "strategy": "sequential",
    "maxConcurrency": 1
  }
}
```

## Common Relations

| Relation | Target | Meaning |
|----------|--------|---------|
| `parent_of` | Agent | Team contains agents |
| `follows` | Agent → Agent | Defines execution order within team |
