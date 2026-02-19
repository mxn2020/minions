---
title: Built-in Types
description: Overview of all built-in minion types shipped with every Minions implementation.
---

Minions ships with **10 built-in types** organized into base types and six conceptual layers.

## Base Types

These four types MUST be supported by all conformant implementations:

| Type | Slug | Icon | Description |
|------|------|------|-------------|
| [Note](/reference/types/note/) | `note` | 📝 | A simple text note |
| [Link](/reference/types/link/) | `link` | 🔗 | A web bookmark |
| [File](/reference/types/file/) | `file` | 📎 | A file attachment reference |
| [Contact](/reference/types/contact/) | `contact` | 👤 | A person or entity |

## Layer Types

Each layer is a conceptual grouping. These types are standard but optional:

| Layer | Type | Slug | Icon | Description |
|-------|------|------|------|-------------|
| Definition | [Agent](/reference/types/agent/) | `agent` | 🤖 | An AI agent definition |
| Organization | [Team](/reference/types/team/) | `team` | 👥 | A group of agents |
| Memory | [Thought](/reference/types/thought/) | `thought` | 💭 | A recorded thought or observation |
| Interface | [Prompt Template](/reference/types/prompt-template/) | `prompt-template` | 📋 | A reusable prompt template |
| Evaluation | [Test Case](/reference/types/test-case/) | `test-case` | 🧪 | A test case for evaluation |
| Execution | [Task](/reference/types/task/) | `task` | ⚡ | A unit of work |

## All Built-in Types in Code

```typescript
import { builtinTypes } from 'minions-core';

// Array of all 10 built-in MinionType objects
console.log(builtinTypes.map(t => t.slug));
// ['note', 'link', 'file', 'contact', 'agent', 'team',
//  'thought', 'prompt-template', 'test-case', 'task']
```

See individual type pages for schemas, examples, and usage.
