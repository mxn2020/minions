---
title: "File"
description: "Built-in type: a file attachment reference."
---

The **File** type represents a reference to a file attachment.

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `filename` | `string` | ✅ yes | Original filename |
| `fileUrl` | `url` | ✅ yes | URL to the file |
| `fileSize` | `number` | no | File size in bytes |
| `mimeType` | `string` | no | MIME type (e.g. `application/pdf`) |

## Metadata

| Property | Value |
|----------|-------|
| **Slug** | `file` |
| **ID** | `builtin-file` |
| **Icon** | 📎 |
| **System** | Yes |
| **Layer** | — (base type) |

## Example

```json
{
  "title": "Training Dataset",
  "minionTypeId": "builtin-file",
  "fields": {
    "filename": "training-data.csv",
    "fileUrl": "https://storage.example.com/datasets/training-data.csv",
    "fileSize": 1048576,
    "mimeType": "text/csv"
  }
}
```
