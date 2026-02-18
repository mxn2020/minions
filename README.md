# Minions

> A universal structured object system for AI agents — queryable, nestable, evolvable, and AI-readable.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Spec: v0.1](https://img.shields.io/badge/Spec-v0.1-green.svg)](spec/v0.1.md)

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

```bash
npm install @minions/core
```

```typescript
import { TypeRegistry, createMinion, RelationGraph } from '@minions/core';

// 1. Get the built-in agent type
const registry = new TypeRegistry();
const agentType = registry.getBySlug('agent')!;

// 2. Create an agent
const { minion: agent, validation } = createMinion({
  title: 'Research Assistant',
  minionTypeId: agentType.id,
  fields: {
    role: 'researcher',
    model: 'gpt-4',
    systemPrompt: 'You are a research assistant.',
    tools: ['web-search', 'summarize'],
  },
}, agentType);

// 3. Link minions together
const graph = new RelationGraph();
graph.add({
  sourceId: agent.id,
  targetId: 'skill-001',
  type: 'parent_of',
});
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
│   ├── core/       # Framework-agnostic TypeScript library
│   └── cli/        # CLI tool
├── spec/           # Specification documents
│   ├── v0.1.md
│   └── conformance.md
└── examples/       # Usage examples
```

## Documentation

- [Specification v0.1](spec/v0.1.md) — the complete specification
- [Conformance Guide](spec/conformance.md) — what implementations must support

## CLI

```bash
npx @minions/cli spec           # Print spec version
npx @minions/cli type list      # List all built-in types
npx @minions/cli validate f.json # Validate a minion file
npx @minions/cli init           # Scaffold a project
```

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines.

## License

[AGPL-3.0](LICENSE) — Copyright (C) 2024 Minions Contributors
