---
title: Relation Types
description: All supported relation types between minions.
---

Relations are typed, directional links between minions. All relations are many-to-many.

## Type Reference

| Type | Semantics | Example |
|------|----------|---------|
| `parent_of` | Hierarchical parent → child | Agent → Skill |
| `depends_on` | Source depends on target | Task B → Task A |
| `implements` | Source implements target spec | Agent → API Contract |
| `relates_to` | Generic association | Note → Note |
| `inspired_by` | Source inspired by target | Agent v2 → Agent v1 |
| `triggers` | Activating source triggers target | Trigger → Action |
| `references` | Source references target | Thought → Document |
| `blocks` | Source blocks target | Bug → Feature |
| `alternative_to` | Source is alternative to target | Agent A → Agent B |
| `part_of` | Source is component of target | Skill → Agent |
| `follows` | Source follows target in sequence | Step 2 → Step 1 |
| `integration_link` | Linked to external system | Minion → External |

## Cascading Behavior

### On Soft Delete

Relations are preserved. The deleted minion is excluded from standard queries but its relations remain for restoration.

### On Hard Delete

All relations where the deleted minion is source **or** target are removed. Target minions are **not** deleted.

## Usage

```typescript
import { RelationGraph } from 'minions-core';

const graph = new RelationGraph();

// Add a relation
const rel = graph.add({
  sourceId: 'agent-001',
  targetId: 'skill-001',
  type: 'parent_of',
});

// Query
graph.getChildren('agent-001');     // ['skill-001']
graph.getParents('skill-001');      // ['agent-001']
graph.getTree('agent-001');         // all descendants
graph.getNetwork('agent-001');      // all connected nodes

// Clean up on hard delete
graph.removeByMinionId('agent-001');
```
