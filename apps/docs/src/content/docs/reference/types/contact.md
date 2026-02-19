---
title: "Contact"
description: "Built-in type: a person or entity contact record."
---

The **Contact** type stores contact information for a person or entity.

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | ✅ yes | Contact name |
| `email` | `email` | no | Email address |
| `phone` | `string` | no | Phone number |
| `company` | `string` | no | Company or organization |
| `notes` | `textarea` | no | Additional notes |

## Metadata

| Property | Value |
|----------|-------|
| **Slug** | `contact` |
| **ID** | `builtin-contact` |
| **Icon** | 👤 |
| **System** | Yes |
| **Layer** | — (base type) |

## Example

```json
{
  "title": "Jane Smith",
  "minionTypeId": "builtin-contact",
  "fields": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "company": "Acme AI",
    "notes": "Met at AI conference 2024. Interested in agent collaboration."
  }
}
```
