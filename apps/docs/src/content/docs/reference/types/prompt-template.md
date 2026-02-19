---
title: "Prompt Template"
description: "Interface Layer: a reusable prompt template with variables."
---

The **Prompt Template** type belongs to the **Interface/Communication Layer** — it defines how a thing presents itself.

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `template` | `textarea` | ✅ yes | Template text with `{{variable}}` placeholders |
| `variables` | `tags` | no | Variable names used in the template |
| `outputFormat` | `select` | no | Expected output format: `text`, `json`, `markdown` |

## Metadata

| Property | Value |
|----------|-------|
| **Slug** | `prompt-template` |
| **ID** | `builtin-prompt-template` |
| **Icon** | 📋 |
| **System** | Yes |
| **Layer** | Interface / Communication |

## Example

```json
{
  "title": "Blog Post Template",
  "minionTypeId": "builtin-prompt-template",
  "fields": {
    "template": "Write a blog post about {{topic}}. Target audience: {{audience}}. Length: {{wordCount}} words.",
    "variables": ["topic", "audience", "wordCount"],
    "outputFormat": "markdown"
  }
}
```
