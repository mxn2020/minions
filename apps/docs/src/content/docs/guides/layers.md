---
title: Layer Model
description: Six conceptual layers for organizing minion types.
---

Minions organizes types into six conceptual layers. Each layer is just a collection of standard MinionTypes — use the ones you need, ignore the rest.

## Layers Overview

| Layer | Purpose | Example Types |
|-------|---------|---------------|
| **Definition** | What a thing is | Agent, Skill, Tool, Personality |
| **Organization** | How things group | Team, Collection, Folder |
| **Memory** | What a thing knows | Thought, Memory, Decision |
| **Interface** | How a thing presents | Prompt Template, Persona |
| **Evaluation** | How a thing is measured | Test Case, Benchmark, Score |
| **Execution** | What a thing does | Task, Workflow, Trigger |

## Definition Layer

The identity of your agent — its role, model, configuration.

**Built-in type: `agent`** — defines an AI agent with fields for role, model, system prompt, temperature, and tools.

## Organization Layer

How agents group together. Teams define execution strategy (sequential, parallel, round-robin).

**Built-in type: `team`** — groups agents with a strategy field.

## Memory/Observation Layer

What your agent knows, remembers, or has observed. Agents can create thoughts, record decisions, and reference past experiences.

**Built-in type: `thought`** — a recorded observation with content and confidence.

## Interface/Communication Layer

How your agent presents itself. Prompt templates define reusable prompts with variables.

**Built-in type: `prompt-template`** — a template with variable interpolation.

## Evaluation Layer

How you measure your agent's performance. Test cases define inputs, expected outputs, and assertions.

**Built-in type: `test-case`** — input/output pairs with assertions.

## Execution Layer

What your agent does at runtime. Tasks track execution status, timing, and errors.

**Built-in type: `task`** — tracks execution with status, timing, and error fields.

:::note
The Execution Layer is defined as an interface only in v0.1. No runtime implementation is provided — bring your own execution engine.
:::

## Progressive Growth

An agent can start as a single flat minion and grow across layers:

```
Research Agent (Definition)
├── Web Search (Definition - Skill)
├── Research Knowledge (Memory)
├── Paper Summary Template (Interface)
├── Accuracy Test (Evaluation)
└── Daily Research Task (Execution)
```

No migration required — just add minions and relations.
