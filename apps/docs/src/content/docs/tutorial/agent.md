---
title: Build an AI Agent
description: Tutorial — build a complete agent from flat minion to nested structure.
---

This tutorial walks you through building an AI agent with Minions, starting simple and growing in complexity.

## Step 1: A Flat Agent

The simplest possible agent is a single minion:

```typescript
import { TypeRegistry, createMinion } from '@minions/core';

const registry = new TypeRegistry();
const agentType = registry.getBySlug('agent')!;

const { minion: agent } = createMinion({
  title: 'Research Assistant',
  minionTypeId: agentType.id,
  fields: {
    role: 'researcher',
    model: 'gpt-4',
    systemPrompt: 'You are a research assistant that finds and summarizes papers.',
    temperature: 0.3,
    tools: ['web-search', 'summarize'],
  },
}, agentType);
```

That's it. A complete, validated agent definition.

## Step 2: Add Memory

Agents need to remember things. Create a thought minion and link it:

```typescript
const thoughtType = registry.getBySlug('thought')!;

const { minion: styleGuide } = createMinion({
  title: 'Research Style Guide',
  minionTypeId: thoughtType.id,
  fields: {
    content: 'Always cite sources. Prefer peer-reviewed papers. Summarize in 3 paragraphs.',
    confidence: 0.95,
    source: 'internal-guidelines',
  },
}, thoughtType);
```

## Step 3: Add a Prompt Template

Define how the agent structures its output:

```typescript
const promptType = registry.getBySlug('prompt-template')!;

const { minion: template } = createMinion({
  title: 'Research Summary Template',
  minionTypeId: promptType.id,
  fields: {
    template: 'Research topic: {{topic}}\n\nSummarize the top {{count}} papers. For each: title, authors, key findings, and relevance score.',
    variables: ['topic', 'count'],
    outputFormat: 'markdown',
  },
}, promptType);
```

## Step 4: Connect Everything

Use relations to build the tree:

```typescript
import { RelationGraph } from '@minions/core';

const graph = new RelationGraph();

// Agent owns the style guide and template
graph.add({ sourceId: agent.id, targetId: styleGuide.id, type: 'parent_of' });
graph.add({ sourceId: agent.id, targetId: template.id, type: 'parent_of' });

// Query the structure
const children = graph.getChildren(agent.id);
// => [styleGuide.id, template.id]

const tree = graph.getTree(agent.id);
// => [styleGuide.id, template.id]
```

## Step 5: Add Evaluation

Create a test case to verify agent quality:

```typescript
const testType = registry.getBySlug('test-case')!;

const { minion: test } = createMinion({
  title: 'Research Quality Test',
  minionTypeId: testType.id,
  fields: {
    input: { topic: 'transformer architectures', count: 3 },
    assertions: {
      containsCitations: true,
      minPapers: 3,
      formatIsMarkdown: true,
    },
    timeout: 30000,
  },
}, testType);

graph.add({ sourceId: agent.id, targetId: test.id, type: 'parent_of' });
```

## Final Structure

```
Research Assistant (agent)
├── Research Style Guide (thought)        ← memory layer
├── Research Summary Template (prompt)     ← interface layer
└── Research Quality Test (test-case)      ← evaluation layer
```

Your agent started as a single flat minion and now has memory, templates, and tests — all validated, all queryable, all linked.
