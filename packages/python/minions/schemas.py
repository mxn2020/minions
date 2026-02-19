"""
Minions SDK — Built-in Type Schemas
Standard built-in MinionType schemas shipped with every Minions implementation.
Mirrors: packages/core/src/schemas/index.ts
"""

from .types import FieldDefinition, FieldValidation, MinionType

# ─── Built-in Types ──────────────────────────────────────────────────────────

note_type = MinionType(
    id="builtin-note",
    name="Note",
    slug="note",
    description="A simple text note.",
    icon="📝",
    is_system=True,
    schema=[
        FieldDefinition(name="content", type="textarea", label="Content", required=True),
    ],
)

link_type = MinionType(
    id="builtin-link",
    name="Link",
    slug="link",
    description="A web link or bookmark.",
    icon="🔗",
    is_system=True,
    schema=[
        FieldDefinition(name="url", type="url", label="URL", required=True),
        FieldDefinition(name="description", type="textarea", label="Description"),
    ],
)

file_type = MinionType(
    id="builtin-file",
    name="File",
    slug="file",
    description="A file attachment reference.",
    icon="📎",
    is_system=True,
    schema=[
        FieldDefinition(name="filename", type="string", label="Filename", required=True),
        FieldDefinition(name="fileUrl", type="url", label="File URL", required=True),
        FieldDefinition(name="fileSize", type="number", label="File Size (bytes)"),
        FieldDefinition(name="mimeType", type="string", label="MIME Type"),
    ],
)

contact_type = MinionType(
    id="builtin-contact",
    name="Contact",
    slug="contact",
    description="A person or entity contact record.",
    icon="👤",
    is_system=True,
    schema=[
        FieldDefinition(name="name", type="string", label="Name", required=True),
        FieldDefinition(name="email", type="email", label="Email"),
        FieldDefinition(name="phone", type="string", label="Phone"),
        FieldDefinition(name="company", type="string", label="Company"),
        FieldDefinition(name="notes", type="textarea", label="Notes"),
    ],
)

# ─── Layer Types ─────────────────────────────────────────────────────────────

agent_type = MinionType(
    id="builtin-agent",
    name="Agent",
    slug="agent",
    description="An AI agent definition.",
    icon="🤖",
    is_system=True,
    schema=[
        FieldDefinition(name="role", type="string", label="Role"),
        FieldDefinition(name="model", type="string", label="Model"),
        FieldDefinition(name="systemPrompt", type="textarea", label="System Prompt"),
        FieldDefinition(name="temperature", type="number", label="Temperature",
                        validation=FieldValidation(min=0, max=2)),
        FieldDefinition(name="maxTokens", type="number", label="Max Tokens"),
        FieldDefinition(name="tools", type="tags", label="Tools"),
    ],
)

team_type = MinionType(
    id="builtin-team",
    name="Team",
    slug="team",
    description="A group of agents working together.",
    icon="👥",
    is_system=True,
    is_organizational=True,
    schema=[
        FieldDefinition(name="members", type="tags", label="Members"),
        FieldDefinition(name="strategy", type="select", label="Strategy",
                        options=["round_robin", "parallel", "sequential"]),
        FieldDefinition(name="maxConcurrency", type="number", label="Max Concurrency"),
    ],
)

thought_type = MinionType(
    id="builtin-thought",
    name="Thought",
    slug="thought",
    description="A recorded thought, observation, or memory.",
    icon="💭",
    is_system=True,
    schema=[
        FieldDefinition(name="content", type="textarea", label="Content", required=True),
        FieldDefinition(name="confidence", type="number", label="Confidence",
                        validation=FieldValidation(min=0, max=1)),
        FieldDefinition(name="source", type="string", label="Source"),
    ],
)

prompt_template_type = MinionType(
    id="builtin-prompt-template",
    name="Prompt Template",
    slug="prompt-template",
    description="A reusable prompt template with variables.",
    icon="📋",
    is_system=True,
    schema=[
        FieldDefinition(name="template", type="textarea", label="Template", required=True),
        FieldDefinition(name="variables", type="tags", label="Variables"),
        FieldDefinition(name="outputFormat", type="select", label="Output Format",
                        options=["text", "json", "markdown"]),
    ],
)

test_case_type = MinionType(
    id="builtin-test-case",
    name="Test Case",
    slug="test-case",
    description="A test case for evaluating agent behavior.",
    icon="🧪",
    is_system=True,
    schema=[
        FieldDefinition(name="input", type="json", label="Input", required=True),
        FieldDefinition(name="expectedOutput", type="json", label="Expected Output"),
        FieldDefinition(name="assertions", type="json", label="Assertions"),
        FieldDefinition(name="timeout", type="number", label="Timeout (ms)"),
    ],
)

task_type = MinionType(
    id="builtin-task",
    name="Task",
    slug="task",
    description="A unit of work to be executed.",
    icon="⚡",
    is_system=True,
    schema=[
        FieldDefinition(name="input", type="json", label="Input"),
        FieldDefinition(name="output", type="json", label="Output"),
        FieldDefinition(name="executionStatus", type="select", label="Execution Status",
                        options=["pending", "running", "completed", "failed", "cancelled"]),
        FieldDefinition(name="startedAt", type="date", label="Started At"),
        FieldDefinition(name="completedAt", type="date", label="Completed At"),
        FieldDefinition(name="error", type="textarea", label="Error"),
    ],
)

# All built-in types as a list
builtin_types: list[MinionType] = [
    note_type,
    link_type,
    file_type,
    contact_type,
    agent_type,
    team_type,
    thought_type,
    prompt_template_type,
    test_case_type,
    task_type,
]
