# minions-sdk

> Framework-agnostic core library for the Minions structured object system — queryable, nestable, evolvable, and AI-readable.

[![npm](https://img.shields.io/npm/v/minions-sdk.svg)](https://www.npmjs.com/package/minions-sdk)
[![PyPI](https://img.shields.io/pypi/v/minions-sdk.svg)](https://pypi.org/project/minions-sdk/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/mxn2020/minions/blob/main/LICENSE)
[![CI](https://github.com/mxn2020/minions/actions/workflows/ci.yml/badge.svg)](https://github.com/mxn2020/minions/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/Docs-minions.help-purple.svg)](https://minions.help)

---

## What is Minions?

Minions gives your AI agents a structured home. Define agents, skills, memory, teams, and workflows as **minions** — typed, validated, nestable structured objects that grow with your needs.

## Install

```bash
npm install minions-sdk
```

## Quick Start

```typescript
import { Minions } from 'minions-sdk';

const minions = new Minions();

// Create an Agent minion
const agent = await minions.create('agent', {
  title: 'Research Assistant',
  fields: {
    role: 'researcher',
    model: 'gpt-4',
    systemPrompt: 'You find and summarize papers.',
  },
});

// Create a Skill minion and link it
const skill = await minions.create('note', { title: 'Web Search Skill' });
agent.linkTo(skill.data.id, 'parent_of');

// Traverse relations
const children = minions.graph.getChildren(agent.data.id);
```

### Modular Usage

If you prefer finer-grained control, you can use the underlying standalone functions directly:

```typescript
import { TypeRegistry, createMinion, RelationGraph } from 'minions-sdk';

const registry = new TypeRegistry();
const agentType = registry.getBySlug('agent')!;

const { minion: agent } = createMinion({ title: 'Research Assistant' }, agentType);

const graph = new RelationGraph();
graph.add({ sourceId: agent.id, targetId: 'skill-001', type: 'parent_of' });
```

## Key Features

- **Three Primitives** — Minion (object), MinionType (schema), Relation (typed link)
- **Six Layers** — Definition, Organization, Memory, Interface, Evaluation, Execution
- **Progressive Complexity** — start flat, grow to nested hierarchies without migration
- **Validation** — schema-driven field validation
- **Relations** — typed, traversable links between any objects
- **Evolution** — schemas evolve, existing data migrates cleanly
- **Middleware** — intercept and customize any operation with a composable pipeline
- **Storage Hooks** — add before/after logic around storage reads and writes
- **Framework Agnostic** — works with any runtime, any storage backend

## Cross-SDK Interop

A Python SDK is also available as [`minions-sdk` on PyPI](https://pypi.org/project/minions-sdk/). Both SDKs serialize to the same JSON format:

```python
pip install minions-sdk
```

```python
from minions import Minions

minions = Minions()
agent = await minions.create("agent", {
    "title": "Research Assistant",
    "fields": {"role": "researcher", "model": "gpt-4"},
})
```

## Documentation

- 📘 [Documentation Site](https://minions.help) — guides, tutorials, and API reference
- 📄 [Specification v0.1](https://github.com/mxn2020/minions/blob/main/spec/v0.1.md)
- 📐 [Conformance Guide](https://github.com/mxn2020/minions/blob/main/spec/conformance.md)

## License

[MIT](https://github.com/mxn2020/minions/blob/main/LICENSE) — Copyright (c) 2024 Mehdi Nabhani.
