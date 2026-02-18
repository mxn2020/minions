# Agent Team Example

A team of agents working together in a content creation pipeline using the Organization Layer.

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
