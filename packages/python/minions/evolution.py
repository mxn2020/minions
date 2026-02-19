"""
Minions SDK — Schema Evolution
Migrate minions when their type schema changes.
Mirrors: packages/core/src/evolution/index.ts
"""

from __future__ import annotations

from typing import Any

from .types import Minion, FieldDefinition
from .lifecycle import now


def migrate_minion(
    minion: Minion,
    old_schema: list[FieldDefinition],
    new_schema: list[FieldDefinition],
) -> Minion:
    """
    Migrate a minion from an old schema to a new schema.

    Rules:
    - Fields added in new schema: get default value or remain absent
    - Fields removed from schema: values move to ``_legacy``
    - Fields whose type changed: if value doesn't match new type, move to ``_legacy``
    - Fields made required: if missing, minion is flagged (via validation)
    """
    new_field_names = {f.name for f in new_schema}
    new_field_map = {f.name: f for f in new_schema}
    old_field_map = {f.name: f for f in old_schema}

    migrated_fields: dict[str, Any] = {}
    legacy: dict[str, Any] = dict(minion._legacy or {})

    # Process existing field values
    for key, value in minion.fields.items():
        if key not in new_field_names:
            # Field removed — move to legacy
            legacy[key] = value
        else:
            new_def = new_field_map[key]
            old_def = old_field_map.get(key)

            if (
                old_def is not None
                and old_def.type != new_def.type
                and not _is_compatible_value(value, new_def.type)
            ):
                # Type changed and value incompatible — move to legacy
                legacy[key] = value
            else:
                # Field still exists with compatible value — keep it
                migrated_fields[key] = value

    # Apply defaults for newly added fields
    for field_def in new_schema:
        if migrated_fields.get(field_def.name) is None and field_def.default_value is not None:
            migrated_fields[field_def.name] = field_def.default_value

    return Minion(
        id=minion.id,
        title=minion.title,
        minion_type_id=minion.minion_type_id,
        fields=migrated_fields,
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
        deleted_at=minion.deleted_at,
        deleted_by=minion.deleted_by,
        searchable_text=minion.searchable_text,
        _legacy=legacy if legacy else None,
    )


def _is_compatible_value(value: Any, target_type: str) -> bool:
    """Basic check if a value is compatible with a target field type."""
    if value is None:
        return True

    match target_type:
        case "string" | "textarea" | "url" | "email" | "date" | "select":
            return isinstance(value, str)
        case "number":
            return isinstance(value, (int, float)) and not isinstance(value, bool)
        case "boolean":
            return isinstance(value, bool)
        case "tags" | "multi-select" | "array":
            return isinstance(value, list)
        case "json":
            return True  # JSON accepts anything
        case _:
            return True
