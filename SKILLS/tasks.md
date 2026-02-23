---
name: minions-tasks
description: Agent skills for managing tasks via the `tasks` CLI. Covers creating, assigning, tracking, blocking, completing, and recurring task management.
---

# minions-tasks — Agent Skills

## What is a Task in the Minions Context?

Before defining types, it's worth being precise. A "task" can mean very different things:

```
a unit of work to be done          → Task
a collection of tasks              → TaskList / Project
something that repeats             → RecurringTask
something blocking something else  → Dependency
a snapshot of progress             → TaskStatus / Checkpoint
who is responsible                 → Assignment
what happened to it over time      → TaskHistory
```

---

## MinionTypes

**Core**
```ts
// task
{
  type: "task",
  fields: {
    title: string,
    description: string,
    status: "backlog" | "todo" | "in-progress" | "blocked" | "done" | "cancelled",
    priority: "critical" | "high" | "medium" | "low",
    assigneeId: string,         // ref to a person or agent
    createdBy: string,
    createdAt: datetime,
    dueAt: datetime,
    completedAt: datetime,
    tags: string[],
    parentTaskId: string,       // for subtasks
    contextRef: {               // what this task belongs to
      type: string,             // "job-posting", "proposal-draft", etc.
      id: string
    }
  }
}

// task-list
{
  type: "task-list",
  fields: {
    name: string,
    description: string,
    taskIds: string[],
    ordered: boolean,           // true = sequence matters
    ownerId: string,
    groupId: string             // ref to minion-group
  }
}

// task-dependency
{
  type: "task-dependency",
  fields: {
    taskId: string,
    dependsOnTaskId: string,
    type: "blocks" | "required-by" | "related-to"
  }
}
```

**Recurrence**
```ts
// recurring-task
{
  type: "recurring-task",
  fields: {
    templateTaskId: string,     // base task definition
    schedule: string,           // cron expression
    nextRunAt: datetime,
    lastRunAt: datetime,
    spawnedTaskIds: string[],   // all instances created from this
    status: "active" | "paused"
  }
}
```

**Assignment & Responsibility**
```ts
// task-assignment
{
  type: "task-assignment",
  fields: {
    taskId: string,
    assigneeId: string,
    assigneeType: "human" | "agent",
    assignedAt: datetime,
    assignedBy: string,
    role: "owner" | "collaborator" | "reviewer" | "observer"
  }
}
```

**Progress & History**
```ts
// task-checkpoint
{
  type: "task-checkpoint",
  fields: {
    taskId: string,
    label: string,              // "halfway done", "first draft complete"
    completedAt: datetime,
    notes: string
  }
}

// task-history-entry
{
  type: "task-history-entry",
  fields: {
    taskId: string,
    changedAt: datetime,
    changedBy: string,          // person or agent id
    field: string,              // which field changed
    from: any,
    to: any
  }
}
```

**Feedback & Outcome**
```ts
// task-comment
{
  type: "task-comment",
  fields: {
    taskId: string,
    authorId: string,
    authorType: "human" | "agent",
    body: string,
    createdAt: datetime,
    resolvedAt: datetime
  }
}

// task-outcome
{
  type: "task-outcome",
  fields: {
    taskId: string,
    result: "success" | "partial" | "failed",
    summary: string,
    artifactIds: string[],      // anything produced by completing this task
    lessons: string             // for agent learning loop
  }
}
```

---

## Relations

```
task            --belongs_to-->     task-list
task            --subtask_of-->     task
task            --blocked_by-->     task-dependency
task            --assigned_to-->    task-assignment
task            --has_checkpoint--> task-checkpoint
task            --has_comment-->    task-comment
task            --produced-->       task-outcome
recurring-task  --spawned-->        task
task            --logged_in-->      task-history-entry
```

---

## How It Connects to Other Toolboxes

The `contextRef` field on `task` is the key bridge:

```
agent-run (minions-agents)         → spawns tasks with contextRef: { type: "agent-run" }
job-posting (minions-jobs)         → has tasks like "research this client"
proposal-draft (minions-proposals) → has tasks like "add portfolio item X"
approval-request (minions-approvals) → is itself a task waiting for human action
schedule (minions-scheduler)       → recurring-task can reference a schedule as its engine
pipeline-entry (minions-pipeline)  → stale entries generate tasks like "follow up on application"
eval-failure (minions-evaluations) → failed benchmarks spawn investigation tasks
```

Rather than every toolbox defining its own ad-hoc "todo" concept, they all point to `minions-tasks` for anything that represents work to be done.

---

## CLI Reference

Install globally:

```bash
pnpm add -g @minions-tasks/cli
```

Set `MINIONS_STORE` env var to control where data is stored (default: `.minions/`).
Storage uses sharded directories: `.minions/<id[0..1]>/<id[2..3]>/<id>.json`

### Discover Types

```bash
# List all 9 MinionTypes with their fields
tasks types list

# Show detailed schema for a specific type
tasks types show task
tasks types show task-list
tasks types show task-dependency
tasks types show recurring-task
tasks types show task-assignment
tasks types show task-checkpoint
tasks types show task-history-entry
tasks types show task-comment
tasks types show task-outcome
```

---

## Skill: Create Task

When a workflow produces a unit of work, create a task.

```bash
# Create with shortcut flags
tasks create task -t "Research client ACME" -s "todo" -p "high"

# Create with full field data
tasks create task --data '{
  "title": "Draft proposal for job-123",
  "status": "todo",
  "priority": "high",
  "assigneeType": "agent",
  "contextRefType": "job-posting",
  "contextRefId": "abc-123",
  "createdBy": "proposal-agent"
}'

# Create a subtask (link to parent)
tasks create task --data '{
  "title": "Write introduction section",
  "status": "todo",
  "priority": "medium",
  "parentTaskId": "<PARENT_TASK_ID>",
  "contextRefType": "task",
  "contextRefId": "<PARENT_TASK_ID>"
}'
```

**Rules:**
- Always set `contextRefType` and `contextRefId` — no orphaned tasks
- Set `assigneeType`: `"agent"` if automatable, `"human"` if needs judgment
- Set `priority`: `"critical"` > `"high"` > `"medium"` > `"low"`

---

## Skill: Assign Task

```bash
# Assign to an agent (default)
tasks assign <TASK_ID> proposal-agent

# Assign to a human as reviewer
tasks assign <TASK_ID> mehdi --type human --role reviewer

# Roles: owner, collaborator, reviewer, observer
```

---

## Skill: Manage Task List

Group related tasks into a list.

```bash
# Create an ordered task list (sequence matters)
tasks create task-list --data '{
  "name": "Proposal workflow for job-123",
  "taskIds": "<TASK_1>,<TASK_2>,<TASK_3>",
  "ordered": true,
  "ownerId": "proposal-agent"
}'

# Create an unordered list (can parallelize)
tasks create task-list --data '{
  "name": "Research tasks",
  "taskIds": "<TASK_A>,<TASK_B>",
  "ordered": false
}'
```

**Rules:**
- If `ordered: true`: do not start task N+1 until task N is `"done"`
- If `ordered: false`: parallelize across agents

---

## Skill: Track Progress

```bash
# Update status
tasks update <TASK_ID> -s "in-progress"

# Log a status change as history entry
tasks create task-history-entry --data '{
  "taskId": "<TASK_ID>",
  "changedAt": "2026-02-23T09:00:00Z",
  "changedBy": "task-agent",
  "field": "status",
  "from": "todo",
  "to": "in-progress"
}'

# Create a checkpoint at a milestone
tasks create task-checkpoint --data '{
  "taskId": "<TASK_ID>",
  "label": "First draft complete",
  "completedAt": "2026-02-23T10:00:00Z",
  "notes": "All sections drafted, needs review"
}'

# Add a comment
tasks comment <TASK_ID> "Waiting on client feedback before proceeding"
```

**Rules:**
- Every status change MUST produce a `task-history-entry`
- Every meaningful milestone SHOULD produce a `task-checkpoint`

---

## Skill: Complete Task

```bash
# Mark done with outcome (creates task-outcome automatically)
tasks complete <TASK_ID> --result success --summary "Proposal submitted" --lessons "Client prefers bullet points"

# Mark with partial success
tasks complete <TASK_ID> --result partial --summary "3 of 5 items done" --lessons "Time estimate was too low"

# Mark as failed
tasks complete <TASK_ID> --result failed --summary "Client rejected scope" --lessons "Confirm budget before starting"

# Or just cancel via soft-delete
tasks delete <TASK_ID>
```

**Rules:**
- Every completed task MUST have a `task-outcome`
- Always include `lessons` — feeds the agent learning loop
- Never hard-delete — use `tasks delete` (soft) or set status to `"cancelled"`

---

## Skill: Handle Blocked Tasks

```bash
# Check all blocked tasks and their dependencies
tasks blocked

# Create a dependency (task-A is blocked by task-B)
tasks create task-dependency --data '{
  "taskId": "<BLOCKED_TASK_ID>",
  "dependsOnTaskId": "<BLOCKING_TASK_ID>",
  "type": "blocks"
}'

# Mark a task as blocked
tasks update <TASK_ID> -s "blocked"

# When blocking task is done, unblock the dependent
tasks update <BLOCKED_TASK_ID> -s "todo"
```

**Dependency types:** `"blocks"`, `"required-by"`, `"related-to"`

**Rules:**
- When a task becomes `"blocked"`, check `task-dependency` records
- Monitor blocking task — when it reaches `"done"`, advance blocked task to `"todo"`
- Log the unblock as a `task-history-entry`

---

## Skill: Recurring Tasks

```bash
# Create a recurring task template
tasks create recurring-task --data '{
  "templateTaskId": "<TEMPLATE_TASK_ID>",
  "schedule": "0 9 * * 1",
  "nextRunAt": "2026-02-24T09:00:00Z",
  "lastRunAt": "",
  "spawnedTaskIds": "",
  "status": "active"
}'

# Pause a recurring task
tasks update <RECURRING_ID> -s "paused"

# Resume
tasks update <RECURRING_ID> -s "active"
```

**Rules:**
- On each tick: check `nextRunAt`, spawn new task from template
- Update `lastRunAt` and recompute `nextRunAt` from cron
- Check `lastRunAt` before spawning to avoid duplicates

---

## Search and Browse

```bash
# Search by title/description
tasks search "proposal"

# Filter by status
tasks list task --status todo

# List all tasks
tasks list task

# List everything
tasks list

# Output as JSON (for piping)
tasks list --json
tasks show <ID> --json

# Show stats
tasks stats
```

---

## Validate

```bash
# Validate a Minion JSON file against its schema
tasks validate ./my-task.json
```

---

## Hard Rules

1. Every task MUST have `contextRefType` + `contextRefId` — no orphans
2. Every completed task MUST have a `task-outcome`
3. Never hard-delete — use soft-delete (`tasks delete <id>`)
4. All status changes → `task-history-entry`
5. Recurring task spawning must be idempotent
6. This agent only writes to `minions-tasks` — reads from others, never writes

---

The `task-outcome` with a `lessons` field is worth highlighting — it gives every agent in your fleet a structured way to feed observations back into the system over time, which becomes the foundation of a learning loop across all your purpose bundles.
