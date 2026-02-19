"""
Minions SDK — Lifecycle Utilities
Create, update, soft delete, hard delete, restore minions.
Mirrors: packages/core/src/lifecycle/index.ts
"""

from __future__ import annotations

import uuid
from copy import deepcopy
from dataclasses import replace
from datetime import datetime, timezone
from typing import Any

from .types import Minion, MinionType, FieldDefinition
from .validation import validate_fields, ValidationResult
from .relations import RelationGraph


# ─── Utility Functions ────────────────────────────────────────────────────────

def generate_id() -> str:
    """Generate a UUID v4 string."""
    return str(uuid.uuid4())


def now() -> str:
    """Get the current time as an ISO 8601 string."""
    return datetime.now(timezone.utc).isoformat()


# ─── Searchable Text ─────────────────────────────────────────────────────────

_SEARCHABLE_FIELD_TYPES = frozenset([
    "string", "textarea", "url", "email", "tags", "select",
])


def _compute_searchable_text(minion: Minion, type: MinionType) -> str:
    """Compute a lowercased full-text search string from a minion."""
    parts: list[str] = [minion.title]

    if minion.description:
        parts.append(minion.description)

    for field_def in type.schema:
        if field_def.type not in _SEARCHABLE_FIELD_TYPES:
            continue
        value = minion.fields.get(field_def.name)
        if value is None:
            continue
        if field_def.type == "tags" and isinstance(value, list):
            parts.append(" ".join(value))
        elif isinstance(value, str):
            parts.append(value)

    return " ".join(parts).lower()


# ─── Defaults ─────────────────────────────────────────────────────────────────

def apply_defaults(
    fields: dict[str, Any],
    type: MinionType,
) -> dict[str, Any]:
    """Apply default values from the schema to a fields object."""
    result = dict(fields)
    for field_def in type.schema:
        if result.get(field_def.name) is None and field_def.default_value is not None:
            result[field_def.name] = field_def.default_value
    return result


# ─── Strip Undefined ──────────────────────────────────────────────────────────

# In Python there is no `undefined`; we use a sentinel to allow callers to
# explicitly mark a field for removal by setting it to _UNDEFINED.

_SENTINEL = object()


def _strip_none_sentinels(fields: dict[str, Any]) -> dict[str, Any]:
    """Remove entries whose value is the _SENTINEL (standing in for TS undefined)."""
    return {k: v for k, v in fields.items() if v is not _SENTINEL}


# ─── Create ──────────────────────────────────────────────────────────────────

def create_minion(
    input: dict[str, Any],
    type: MinionType,
) -> tuple[Minion, ValidationResult]:
    """
    Create a new Minion instance from input, generating id and timestamps.
    Validates fields against the provided MinionType schema.

    Returns a tuple of (minion, validation_result).
    """
    fields = apply_defaults(input.get("fields") or {}, type)
    validation = validate_fields(fields, type.schema)

    ts = now()
    minion = Minion(
        id=generate_id(),
        title=input["title"],
        minion_type_id=type.id,
        fields=fields,
        created_at=ts,
        updated_at=ts,
        tags=input.get("tags"),
        status=input.get("status", "active"),
        priority=input.get("priority"),
        description=input.get("description"),
        due_date=input.get("due_date") or input.get("dueDate"),
        category_id=input.get("category_id") or input.get("categoryId"),
        folder_id=input.get("folder_id") or input.get("folderId"),
        created_by=input.get("created_by") or input.get("createdBy"),
    )

    minion.searchable_text = _compute_searchable_text(minion, type)
    return minion, validation


# ─── Update ──────────────────────────────────────────────────────────────────

def update_minion(
    minion: Minion,
    input: dict[str, Any],
    type: MinionType,
) -> tuple[Minion, ValidationResult]:
    """
    Update an existing Minion with new values.
    Validates updated fields against the provided MinionType schema.

    Returns a tuple of (updated_minion, validation_result).
    """
    # Merge fields — strip keys whose value is None (standing in for TS undefined)
    merged_fields = {**minion.fields, **(input.get("fields") or {})}
    fields = {k: v for k, v in merged_fields.items() if v is not None}
    validation = validate_fields(fields, type.schema)

    updated = Minion(
        id=minion.id,
        title=input.get("title") or minion.title,
        minion_type_id=minion.minion_type_id,
        fields=fields,
        created_at=minion.created_at,
        updated_at=now(),
        tags=input.get("tags") if input.get("tags") is not None else minion.tags,
        status=input.get("status") or minion.status,
        priority=input.get("priority") or minion.priority,
        description=input.get("description") if input.get("description") is not None else minion.description,
        due_date=input.get("due_date") or input.get("dueDate") or minion.due_date,
        category_id=input.get("category_id") or input.get("categoryId") or minion.category_id,
        folder_id=input.get("folder_id") or input.get("folderId") or minion.folder_id,
        created_by=minion.created_by,
        updated_by=input.get("updated_by") or input.get("updatedBy"),
        deleted_at=minion.deleted_at,
        deleted_by=minion.deleted_by,
        searchable_text=minion.searchable_text,
        _legacy=minion._legacy,
    )

    updated.searchable_text = _compute_searchable_text(updated, type)
    return updated, validation


# ─── Soft Delete ──────────────────────────────────────────────────────────────

def soft_delete(minion: Minion, deleted_by: str | None = None) -> Minion:
    """Soft-delete a minion by setting deletedAt/deletedBy."""
    ts = now()
    return Minion(
        id=minion.id,
        title=minion.title,
        minion_type_id=minion.minion_type_id,
        fields=minion.fields,
        created_at=minion.created_at,
        updated_at=ts,
        tags=minion.tags,
        status=minion.status,
        priority=minion.priority,
        description=minion.description,
        due_date=minion.due_date,
        category_id=minion.category_id,
        folder_id=minion.folder_id,
        created_by=minion.created_by,
        updated_by=minion.updated_by,
        deleted_at=ts,
        deleted_by=deleted_by,
        searchable_text=minion.searchable_text,
        _legacy=minion._legacy,
    )


# ─── Hard Delete ──────────────────────────────────────────────────────────────

def hard_delete(minion: Minion, graph: RelationGraph) -> None:
    """
    Hard-delete a minion by removing all of its relations from the graph.
    The caller is responsible for removing the minion object itself.
    """
    graph.remove_by_minion_id(minion.id)


# ─── Restore ─────────────────────────────────────────────────────────────────

def restore_minion(minion: Minion) -> Minion:
    """Restore a soft-deleted minion."""
    return Minion(
        id=minion.id,
        title=minion.title,
        minion_type_id=minion.minion_type_id,
        fields=minion.fields,
        created_at=minion.created_at,
        updated_at=now(),
        tags=minion.tags,
        status=minion.status,
        priority=minion.priority,
        description=minion.description,
        due_date=minion.due_date,
        category_id=minion.category_id,
        folder_id=minion.folder_id,
        created_by=minion.created_by,
        updated_by=minion.updated_by,
        deleted_at=None,
        deleted_by=None,
        searchable_text=minion.searchable_text,
        _legacy=minion._legacy,
    )
