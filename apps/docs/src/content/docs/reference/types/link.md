---
title: "Link"
description: "Built-in type: a web bookmark or link."
---

The **Link** type represents a web bookmark or URL reference.

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | `url` | ✅ yes | The target URL (http/https) |
| `description` | `textarea` | no | Description of the link |

## Metadata

| Property | Value |
|----------|-------|
| **Slug** | `link` |
| **ID** | `builtin-link` |
| **Icon** | 🔗 |
| **System** | Yes |
| **Layer** | — (base type) |

## Example

```json
{
  "title": "OpenAI API Docs",
  "minionTypeId": "builtin-link",
  "fields": {
    "url": "https://platform.openai.com/docs",
    "description": "Official OpenAI API documentation."
  }
}
```
