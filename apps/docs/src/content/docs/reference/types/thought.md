---
title: "Thought"
description: "Memory Layer: a recorded thought or observation."
---

The **Thought** type belongs to the **Memory/Observation Layer** — it records what a thing knows or has experienced.

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | `textarea` | ✅ yes | The thought content |
| `confidence` | `number` | no | Confidence score (0–1) |
| `source` | `string` | no | Origin of the thought |

## Metadata

| Property | Value |
|----------|-------|
| **Slug** | `thought` |
| **ID** | `builtin-thought` |
| **Icon** | 💭 |
| **System** | Yes |
| **Layer** | Memory / Observation |

## Example

```json
{
  "title": "Writing Style Preference",
  "minionTypeId": "builtin-thought",
  "fields": {
    "content": "Use active voice, short paragraphs, and concrete examples.",
    "confidence": 0.9,
    "source": "editorial-guidelines"
  }
}
```

## Use Cases

- Agent internal state (opinions, decisions, tree-of-thought)
- Episodic memory entries
- Observation logs from agent runs
