---
title: "Agent"
description: "Definition Layer: an AI agent definition."
---

The **Agent** type belongs to the **Definition Layer** — it defines what a thing *is*.

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | `string` | no | Agent's role or purpose |
| `model` | `string` | no | LLM model identifier (e.g. `gpt-4`) |
| `systemPrompt` | `textarea` | no | System prompt for the agent |
| `temperature` | `number` | no | Sampling temperature (0–2) |
| `maxTokens` | `number` | no | Maximum token limit |
| `tools` | `tags` | no | Available tool names |

## Metadata

| Property | Value |
|----------|-------|
| **Slug** | `agent` |
| **ID** | `builtin-agent` |
| **Icon** | 🤖 |
| **System** | Yes |
| **Layer** | Definition |

## Example

```json
{
  "title": "Research Assistant",
  "minionTypeId": "builtin-agent",
  "status": "active",
  "fields": {
    "role": "researcher",
    "model": "gpt-4",
    "systemPrompt": "You are a research assistant that finds and summarizes papers.",
    "temperature": 0.3,
    "maxTokens": 4096,
    "tools": ["web-search", "summarize", "cite"]
  },
  "tags": ["research", "ai-assistant"]
}
```

## Common Relations

| Relation | Target | Meaning |
|----------|--------|---------|
| `parent_of` | Thought, Prompt Template, Test Case | Agent owns sub-minions |
| `implements` | API Contract | Agent satisfies an interface |
| `depends_on` | Another Agent | Agent requires another agent |
