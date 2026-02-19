---
title: "Task"
description: "Execution Layer: a unit of work to be executed."
---

The **Task** type belongs to the **Execution Layer** — it defines what a thing does.

:::note
The Execution Layer is defined as an **interface only** in v0.1. No runtime implementation is specified — implementations may interpret execution differently.
:::

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `input` | `json` | no | Task input data |
| `output` | `json` | no | Task output data |
| `executionStatus` | `select` | no | Status: `pending`, `running`, `completed`, `failed`, `cancelled` |
| `startedAt` | `date` | no | Execution start time |
| `completedAt` | `date` | no | Execution completion time |
| `error` | `textarea` | no | Error message if failed |

## Metadata

| Property | Value |
|----------|-------|
| **Slug** | `task` |
| **ID** | `builtin-task` |
| **Icon** | ⚡ |
| **System** | Yes |
| **Layer** | Execution |

## Example

```json
{
  "title": "Summarize Research Paper",
  "minionTypeId": "builtin-task",
  "status": "in_progress",
  "fields": {
    "input": { "paperUrl": "https://arxiv.org/abs/..." },
    "executionStatus": "running",
    "startedAt": "2024-01-15T10:00:00Z"
  }
}
```
