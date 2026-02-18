---
title: Quick Start
description: Get up and running with Minions in 5 minutes.
---

## Installation

```bash
npm install @minions/core
```

## Create Your First Agent

```typescript
import { TypeRegistry, createMinion } from '@minions/core';

// 1. Initialize the type registry (comes with built-in types)
const registry = new TypeRegistry();

// 2. Get the agent type
const agentType = registry.getBySlug('agent')!;

// 3. Create an agent minion
const { minion, validation } = createMinion({
  title: 'Research Assistant',
  minionTypeId: agentType.id,
  fields: {
    role: 'researcher',
    model: 'gpt-4',
    systemPrompt: 'You are a research assistant.',
    tools: ['web-search', 'summarize'],
  },
}, agentType);

console.log(validation.valid); // true
console.log(minion.id);        // generated UUID
```

## Link Minions Together

```typescript
import { RelationGraph } from '@minions/core';

const graph = new RelationGraph();

// Create a parent-child relation
graph.add({
  sourceId: agent.id,
  targetId: skillMinion.id,
  type: 'parent_of',
});

// Query the graph
const children = graph.getChildren(agent.id);
const tree = graph.getTree(agent.id);
```

## Validate a Minion File

```bash
npx @minions/cli validate my-agent.json
```

## Next Steps

- Learn about the [three core primitives](/guides/primitives/)
- Understand the [layer model](/guides/layers/)
- Follow the [AI agent tutorial](/tutorial/agent/)
