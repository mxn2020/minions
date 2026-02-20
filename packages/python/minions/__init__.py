"""
Minions SDK — Python
Framework-agnostic core library for the Minions structured object system.

Usage::

    from minions import TypeRegistry, create_minion, RelationGraph

    registry = TypeRegistry()
    agent_type = registry.get_by_slug("agent")

    minion, validation = create_minion(
        {"title": "Research Assistant", "fields": {"role": "researcher"}},
        agent_type,
    )
"""

from __future__ import annotations

# ─── Version ──────────────────────────────────────────────────────────────────

SPEC_VERSION = "0.2.0"

# ─── Types ────────────────────────────────────────────────────────────────────

from .types import (
    FieldType,
    FieldValidation,
    FieldDefinition,
    RelationType,
    MinionStatus,
    MinionPriority,
    Minion,
    MinionType,
    Relation,
    CreateMinionInput,
    UpdateMinionInput,
    CreateRelationInput,
    ExecutionResult,
    Executable,
)

# ─── Validation ───────────────────────────────────────────────────────────────

from .validation import (
    ValidationError,
    ValidationResult,
    validate_field,
    validate_fields,
)

# ─── Schemas ──────────────────────────────────────────────────────────────────

from .schemas import (
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
    builtin_types,
)

# ─── Registry ─────────────────────────────────────────────────────────────────

from .registry import TypeRegistry

# ─── Relations ────────────────────────────────────────────────────────────────

from .relations import RelationGraph

# ─── Lifecycle ────────────────────────────────────────────────────────────────

from .lifecycle import (
    create_minion,
    update_minion,
    soft_delete,
    hard_delete,
    restore_minion,
    apply_defaults,
    generate_id,
    now,
)

# ─── Evolution ────────────────────────────────────────────────────────────────

from .evolution import migrate_minion

# ─── Client ───────────────────────────────────────────────────────────────────

from .client import Minions, MinionWrapper, MinionPlugin

# ─── Storage ──────────────────────────────────────────────────────────────────

from .storage import StorageAdapter, StorageFilter, MemoryStorageAdapter, JsonFileStorageAdapter

# ─── Public API ───────────────────────────────────────────────────────────────

__all__ = [
    # Version
    "SPEC_VERSION",
    # Types
    "FieldType",
    "FieldValidation",
    "FieldDefinition",
    "RelationType",
    "MinionStatus",
    "MinionPriority",
    "Minion",
    "MinionType",
    "Relation",
    "CreateMinionInput",
    "UpdateMinionInput",
    "CreateRelationInput",
    "ExecutionResult",
    "Executable",
    # Validation
    "ValidationError",
    "ValidationResult",
    "validate_field",
    "validate_fields",
    # Schemas
    "note_type",
    "link_type",
    "file_type",
    "contact_type",
    "agent_type",
    "team_type",
    "thought_type",
    "prompt_template_type",
    "test_case_type",
    "task_type",
    "builtin_types",
    # Registry
    "TypeRegistry",
    # Relations
    "RelationGraph",
    # Lifecycle
    "create_minion",
    "update_minion",
    "soft_delete",
    "hard_delete",
    "restore_minion",
    "apply_defaults",
    "generate_id",
    "now",
    # Evolution
    "migrate_minion",
    # Client
    "Minions",
    "MinionWrapper",
    "MinionPlugin",
    # Storage
    "StorageAdapter",
    "StorageFilter",
    "MemoryStorageAdapter",
    "JsonFileStorageAdapter",
]
