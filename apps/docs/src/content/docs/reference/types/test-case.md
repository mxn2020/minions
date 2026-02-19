---
title: "Test Case"
description: "Evaluation Layer: a test case for evaluating agent behavior."
---

The **Test Case** type belongs to the **Evaluation Layer** — it defines how a thing is measured.

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `input` | `json` | ✅ yes | Test input data |
| `expectedOutput` | `json` | no | Expected output for comparison |
| `assertions` | `json` | no | Assertion rules (custom format) |
| `timeout` | `number` | no | Timeout in milliseconds |

## Metadata

| Property | Value |
|----------|-------|
| **Slug** | `test-case` |
| **ID** | `builtin-test-case` |
| **Icon** | 🧪 |
| **System** | Yes |
| **Layer** | Evaluation |

## Example

```json
{
  "title": "Content Quality Check",
  "minionTypeId": "builtin-test-case",
  "fields": {
    "input": { "topic": "AI agents", "audience": "developers" },
    "expectedOutput": null,
    "assertions": {
      "minWordCount": 600,
      "containsHeadings": true
    },
    "timeout": 30000
  }
}
```
