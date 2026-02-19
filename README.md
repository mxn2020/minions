# Minions

> A universal structured object system for AI agents — queryable, nestable, evolvable, and AI-readable.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Spec: v0.1](https://img.shields.io/badge/Spec-v0.1-green.svg)](spec/v0.1.md)
[![CI](https://github.com/mxn2020/minions/actions/workflows/ci.yml/badge.svg)](https://github.com/mxn2020/minions/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/minions-sdk.svg)](https://www.npmjs.com/package/minions-sdk)
[![PyPI](https://img.shields.io/pypi/v/minions-sdk.svg)](https://pypi.org/project/minions-sdk/)
[![Docs](https://img.shields.io/badge/Docs-minions.wtf-purple.svg)](https://minions.wtf)

---

## What is Minions?

Minions gives your AI agents a structured home. Define agents, skills, memory, teams, and workflows as **minions** — typed, validated, nestable structured objects that grow with your needs.

```json
{
  "id": "agent-001",
  "title": "Research Assistant",
  "minionTypeId": "builtin-agent",
  "status": "active",
  "fields": {
    "role": "researcher",
    "model": "gpt-4",
    "systemPrompt": "You are a research assistant that finds and summarizes papers.",
    "tools": ["web-search", "summarize", "cite"]
  }
}
```

## Three Primitives

Everything in Minions is built from three simple concepts:

| Primitive | What it is | Example |
|-----------|-----------|---------|
| **Minion** | A structured object instance | An agent, a note, a task |
| **MinionType** | The schema that defines a kind of minion | "Agent", "Note", "Team" |
| **Relation** | A typed link between two minions | Agent → Skill (`parent_of`) |

## The Layer Model

Minions organizes types into six conceptual layers:

| Layer | Purpose | Example Types |
|-------|---------|---------------|
| **Definition** | What a thing is | Agent, Skill, Tool, Personality |
| **Organization** | How things group | Team, Collection, Folder |
| **Memory** | What a thing knows | Thought, Memory, Decision |
| **Interface** | How a thing presents itself | Prompt Template, Persona |
| **Evaluation** | How a thing is measured | Test Case, Benchmark, Score |
| **Execution** | What a thing does | Task, Workflow, Trigger |

Each layer is just a standard MinionType. Use the layers you need, ignore the rest.

## Progressive Complexity

Start simple, grow without migration pain.

**Flat agent** — a single minion:

```json
{
  "title": "Writer Agent",
  "minionTypeId": "builtin-agent",
  "fields": {
    "role": "writer",
    "model": "gpt-4",
    "systemPrompt": "You write blog posts."
  }
}
```

**Nested agent** — the same agent with skills, memory, and tests linked via relations:

```
Writer Agent (agent)
├── Blog Writing (skill)          ← parent_of
├── SEO Optimization (skill)      ← parent_of
├── Writing Style Guide (thought) ← parent_of
├── Draft Blog Post (prompt)      ← parent_of
└── Quality Check (test-case)     ← parent_of
```

Same system. No migration. Just add minions and relations.

## Quick Start

### TypeScript

```bash
pnpm add minions-sdk
```

```typescript
import { TypeRegistry, createMinion, RelationGraph } from 'minions-sdk';

const registry = new TypeRegistry();
const agentType = registry.getBySlug('agent')!;

const { minion: agent, validation } = createMinion({
  title: 'Research Assistant',
  fields: {
    role: 'researcher',
    model: 'gpt-4',
    systemPrompt: 'You are a research assistant.',
    tools: ['web-search', 'summarize'],
  },
}, agentType);

const graph = new RelationGraph();
graph.add({ sourceId: agent.id, targetId: 'skill-001', type: 'parent_of' });
```

### Python

```bash
pip install minions-sdk
```

```python
from minions import TypeRegistry, create_minion, RelationGraph

registry = TypeRegistry()
agent_type = registry.get_by_slug("agent")

agent, validation = create_minion(
    {
        "title": "Research Assistant",
        "fields": {
            "role": "researcher",
            "model": "gpt-4",
            "systemPrompt": "You are a research assistant.",
            "tools": ["web-search", "summarize"],
        },
    },
    agent_type,
)

graph = RelationGraph()
graph.add({"source_id": agent.id, "target_id": "skill-001", "type": "parent_of"})
```

### Cross-SDK Interop

Minions created in either SDK serialize to the same JSON format:

```python
import json
data = agent.to_dict()        # Python → camelCase dict
json_str = json.dumps(data)   # → compatible with TypeScript SDK
```

## Why Minions?

Current AI agent frameworks give you execution but no **structure**. Your agent's identity, memory, skills, and configuration live scattered across config files, databases, and code. Minions gives you:

- **One format** for everything — agents, skills, memory, tasks, tests
- **Validation** — fields are schema-driven and validated
- **Relations** — typed links between any objects
- **Evolution** — schemas change, existing data migrates cleanly
- **Framework agnostic** — works with any runtime, any storage

## Project Structure

```
minions/
├── packages/
│   ├── core/       # TypeScript SDK (minions-sdk on npm)
│   ├── python/     # Python SDK (minions-sdk on PyPI)
│   └── cli/        # CLI tool
├── apps/
│   ├── web/        # Interactive playground app
│   └── docs/       # Documentation site
├── spec/           # Specification documents
│   ├── v0.1.md
│   └── conformance.md
└── examples/       # Usage examples
```

## Documentation

- 📘 [Documentation Site](https://minions.wtf) — guides, tutorials, and API reference
- [Specification v0.1](spec/v0.1.md) — the complete specification
- [Conformance Guide](spec/conformance.md) — what implementations must support

## CLI

```bash
pnpm exec minions spec           # Print spec version
pnpm exec minions type list      # List all built-in types
pnpm exec minions validate f.json # Validate a minion file
pnpm exec minions init           # Scaffold a project
```

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) — Copyright (c) 2026 Minions Contributors. MIT licensed — use it freely in commercial projects.
