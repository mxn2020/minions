---
title: Layer Model
description: Six conceptual layers for organizing minion types.
---

Minions organizes types into six conceptual layers. Each layer is just a collection of standard MinionTypes — use the ones you need, ignore the rest.

## Architecture Overview

The six layers stack conceptually from identity at the bottom to runtime at the top:

```
┌─────────────────────────────────────────────────┐
│              ⚡  EXECUTION LAYER                 │
│         Tasks, Workflows, Triggers               │
├─────────────────────────────────────────────────┤
│              🧪  EVALUATION LAYER                │
│         Test Cases, Benchmarks, Scores           │
├─────────────────────────────────────────────────┤
│              📋  INTERFACE LAYER                 │
│         Prompt Templates, Personas, Contracts    │
├─────────────────────────────────────────────────┤
│              💭  MEMORY LAYER                    │
│         Thoughts, Decisions, Observations        │
├─────────────────────────────────────────────────┤
│              👥  ORGANIZATION LAYER              │
│         Teams, Collections, Hierarchies          │
├─────────────────────────────────────────────────┤
│              🤖  DEFINITION LAYER                │
│         Agents, Skills, Tools, Personality        │
└─────────────────────────────────────────────────┘
```

## Layers Overview

| Layer | Purpose | Built-in Type | Example Types |
|-------|---------|---------------|---------------|
| **Definition** | What a thing is | `agent` | Agent, Skill, Tool, Personality |
| **Organization** | How things group | `team` | Team, Collection, Folder |
| **Memory** | What a thing knows | `thought` | Thought, Memory, Decision |
| **Interface** | How a thing presents | `prompt-template` | Prompt Template, Persona |
| **Evaluation** | How a thing is measured | `test-case` | Test Case, Benchmark, Score |
| **Execution** | What a thing does | `task` | Task, Workflow, Trigger |

## Inter-Layer Relationships

Layers connect via typed relations. Here's how a fully-realized agent connects across layers:

```
                    ┌──────────────┐
                    │  Daily Task  │ ⚡ Execution
                    └──────┬───────┘
                           │ triggers
                    ┌──────▼───────┐
                    │ Quality Test │ 🧪 Evaluation
                    └──────┬───────┘
                           │ references
                    ┌──────▼───────┐
                    │   Prompt     │ 📋 Interface
                    │  Template    │
                    └──────┬───────┘
                           │ references
                    ┌──────▼───────┐
                    │   Thought    │ 💭 Memory
                    └──────┬───────┘
                           │ part_of
    ┌──────────┐    ┌──────▼───────┐
    │   Team   │◄───│    Agent     │ 🤖 Definition
    │          │    │              │
    └──────────┘    └──────────────┘
     👥 Org          parent_of ↕
```

## Definition Layer

The identity of your agent — its role, model, configuration.

**Built-in type: `agent`** — defines an AI agent with fields for role, model, system prompt, temperature, and tools.

```
Agent (🤖)
├── role: "researcher"
├── model: "gpt-4"
├── systemPrompt: "You are a research assistant..."
├── temperature: 0.3
└── tools: ["web-search", "summarize"]
```

## Organization Layer

How agents group together. Teams define execution strategy (sequential, parallel, round-robin).

**Built-in type: `team`** — groups agents with a strategy field.

```
Content Team (👥)
├── members: [writer, editor, seo]
├── strategy: "sequential"
│
├── Writer (🤖) ──follows──▶ Editor (🤖) ──follows──▶ SEO (🤖)
│   Sequential execution pipeline
```

## Memory/Observation Layer

What your agent knows, remembers, or has observed. Agents can create thoughts, record decisions, and reference past experiences.

**Built-in type: `thought`** — a recorded observation with content and confidence.

```
Agent Memory (💭)
├── "Use active voice" (confidence: 0.95)
├── "Prefer peer-reviewed sources" (confidence: 0.90)
└── "User prefers summaries under 500 words" (confidence: 0.80)
```

## Interface/Communication Layer

How your agent presents itself. Prompt templates define reusable prompts with variables.

**Built-in type: `prompt-template`** — a template with variable interpolation.

```
Prompt Template (📋)
├── template: "Research {{topic}} for {{audience}}..."
├── variables: [topic, audience, format]
└── outputFormat: "markdown"
```

## Evaluation Layer

How you measure your agent's performance. Test cases define inputs, expected outputs, and assertions.

**Built-in type: `test-case`** — input/output pairs with assertions.

```
Test Case (🧪)
├── input: { topic: "AI agents", count: 3 }
├── assertions: { containsCitations: true, minPapers: 3 }
└── timeout: 30000ms
```

## Execution Layer

What your agent does at runtime. Tasks track execution status, timing, and errors.

**Built-in type: `task`** — tracks execution with status, timing, and error fields.

```
Task (⚡)
├── input: { ... }
├── executionStatus: "completed"
├── startedAt: "2024-01-15T10:00:00Z"
├── completedAt: "2024-01-15T10:05:00Z"
└── output: { ... }
```

:::note
The Execution Layer is defined as an interface only in v0.1. No runtime implementation is provided — bring your own execution engine.
:::

## Progressive Growth

An agent can start as a single flat minion and grow across any layer:

```
                    Research Agent
                    ┌──────────────────────────────────┐
                    │  🤖 Agent (Definition)            │
                    │     role: "researcher"            │
                    │     model: "gpt-4"                │
                    └──────────┬───────────────────────┘
                               │ parent_of
          ┌────────────────────┼────────────────────┐
          │                    │                    │
 ┌────────▼─────┐   ┌─────────▼──────┐   ┌────────▼──────┐
 │ 💭 Thought    │   │ 📋 Prompt       │   │ 🧪 Test Case  │
 │ Style Guide  │   │ Summary Tmpl   │   │ Quality Check │
 │ (Memory)     │   │ (Interface)    │   │ (Evaluation)  │
 └──────────────┘   └────────────────┘   └───────────────┘
```

No migration required — just add minions and relations. Each layer is optional; use exactly the ones your agent needs.
