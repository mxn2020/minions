# Agent Team Example

A team of agents working together in a content creation pipeline using the Organization Layer.

> **Note:** `team.json` is a grouped document containing the team, its member agents, and their relations. It is **not** a standalone minion file — running `minions validate team.json` will fail because the CLI expects a single flat minion object with a top-level `minionTypeId`. See [`agent-simple/`](../agent-simple/) for a validatable single-minion example.

## Structure

```
Content Creation Team (team, strategy: sequential)
├── Writer (agent)        ← writes first draft
├── Editor (agent)        ← follows Writer, reviews draft
└── SEO Optimizer (agent) ← follows Editor, optimizes for search
```

## Relations

- `parent_of`: Team → each Agent
- `follows`: Editor → Writer, SEO → Editor (defines sequence)

## Key Concepts

- Teams use `strategy` to define execution order
- `follows` relations define the processing pipeline
- Each agent can be independently defined and tested
