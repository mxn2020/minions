# Nested Agent Example

An agent with nested children: memory (thought), interface (prompt template), and evaluation (test case), all linked via `parent_of` relations.

## Structure

```
Blog Writer (agent)
├── Writing Style Guide (thought)       ← memory layer
├── Blog Post Template (prompt-template) ← interface layer
└── Content Quality Check (test-case)    ← evaluation layer
```

## Key Concepts

- The root agent is a minion of type `agent`
- Children are minions of various layer types
- `parent_of` relations connect the agent to its children
- Each child can itself have children, creating arbitrary depth
