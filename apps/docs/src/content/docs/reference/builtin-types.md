---
title: Built-in Types
description: Standard minion types shipped with every Minions implementation.
---

Minions ships with 10 built-in types spanning the four standard types and six layer types.

## Standard Types

### Note (`note`)

A simple text note.

| Field | Type | Required |
|-------|------|----------|
| `content` | textarea | ✅ |

### Link (`link`)

A web bookmark.

| Field | Type | Required |
|-------|------|----------|
| `url` | url | ✅ |
| `description` | textarea | |

### File (`file`)

A file attachment reference.

| Field | Type | Required |
|-------|------|----------|
| `filename` | string | ✅ |
| `fileUrl` | url | ✅ |
| `fileSize` | number | |
| `mimeType` | string | |

### Contact (`contact`)

A person or entity.

| Field | Type | Required |
|-------|------|----------|
| `name` | string | ✅ |
| `email` | email | |
| `phone` | string | |
| `company` | string | |
| `notes` | textarea | |

## Layer Types

### Agent (`agent`) — Definition Layer

| Field | Type | Required |
|-------|------|----------|
| `role` | string | |
| `model` | string | |
| `systemPrompt` | textarea | |
| `temperature` | number (0–2) | |
| `maxTokens` | number | |
| `tools` | tags | |

### Team (`team`) — Organization Layer

| Field | Type | Required |
|-------|------|----------|
| `members` | tags | |
| `strategy` | select (round_robin, parallel, sequential) | |
| `maxConcurrency` | number | |

### Thought (`thought`) — Memory Layer

| Field | Type | Required |
|-------|------|----------|
| `content` | textarea | ✅ |
| `confidence` | number (0–1) | |
| `source` | string | |

### Prompt Template (`prompt-template`) — Interface Layer

| Field | Type | Required |
|-------|------|----------|
| `template` | textarea | ✅ |
| `variables` | tags | |
| `outputFormat` | select (text, json, markdown) | |

### Test Case (`test-case`) — Evaluation Layer

| Field | Type | Required |
|-------|------|----------|
| `input` | json | ✅ |
| `expectedOutput` | json | |
| `assertions` | json | |
| `timeout` | number | |

### Task (`task`) — Execution Layer

| Field | Type | Required |
|-------|------|----------|
| `input` | json | |
| `output` | json | |
| `executionStatus` | select (pending, running, completed, failed, cancelled) | |
| `startedAt` | date | |
| `completedAt` | date | |
| `error` | textarea | |

## Accessing Built-in Types

```typescript
import { TypeRegistry, builtinTypes, agentType, noteType } from '@minions/core';

// Via registry
const registry = new TypeRegistry();
const agent = registry.getBySlug('agent');

// Direct imports
console.log(agentType.schema);
console.log(builtinTypes.length); // 10
```
