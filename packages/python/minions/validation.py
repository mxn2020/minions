"""
Minions SDK — Validation Engine
Validates minion field values against their MinionType schema.
Mirrors: packages/core/src/validation/index.ts
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Optional
from urllib.parse import urlparse

from .types import FieldDefinition, FieldType


# ─── Result Types ─────────────────────────────────────────────────────────────

@dataclass
class ValidationError:
    field: str
    message: str
    value: Any = None

    def to_dict(self) -> dict:
        return {"field": self.field, "message": self.message, "value": self.value}


@dataclass
class ValidationResult:
    valid: bool
    errors: list[ValidationError] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "valid": self.valid,
            "errors": [e.to_dict() for e in self.errors],
        }


# ─── Regex Constants ───────────────────────────────────────────────────────────

_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

# Matches:
#   2024-01-15
#   2024-01-15T10:30:00Z
#   2024-01-15T10:30:00.123Z
#   2024-01-15T10:30:00+02:00
_ISO8601_RE = re.compile(
    r"^\d{4}-\d{2}-\d{2}"
    r"(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2}))?$"
)


# ─── Public API ───────────────────────────────────────────────────────────────

def validate_field(value: Any, field_def: FieldDefinition) -> list[ValidationError]:
    """
    Validate a single field value against its FieldDefinition.
    Returns a list of ValidationErrors (empty = valid).

    Mirrors: validateField() in validation/index.ts
    """
    errors: list[ValidationError] = []
    is_absent = value is None or value == ""

    # Required check — bail early, no point running type checks
    if field_def.required and is_absent:
        errors.append(ValidationError(
            field=field_def.name,
            message=f'Field "{field_def.name}" is required',
            value=value,
        ))
        return errors

    # Optional and absent — nothing more to check
    if is_absent:
        return errors

    # Dispatch to type-specific validator
    errors.extend(_validate_by_type(value, field_def))
    return errors


def validate_fields(
    fields: dict[str, Any],
    schema: list[FieldDefinition],
) -> ValidationResult:
    """
    Validate all fields of a minion against a MinionType schema.
    Returns a ValidationResult with valid flag and collected errors.

    Mirrors: validateFields() in validation/index.ts
    """
    errors: list[ValidationError] = []
    for field_def in schema:
        value = fields.get(field_def.name)
        errors.extend(validate_field(value, field_def))

    return ValidationResult(valid=len(errors) == 0, errors=errors)


# ─── Type Validators ──────────────────────────────────────────────────────────

def _validate_by_type(value: Any, field_def: FieldDefinition) -> list[ValidationError]:
    """Dispatch to the correct type validator."""
    validators: dict[FieldType, Any] = {
        "string":       _validate_string,
        "textarea":     _validate_string,
        "number":       _validate_number,
        "boolean":      _validate_boolean,
        "date":         _validate_date,
        "select":       _validate_select,
        "multi-select": _validate_multi_select,
        "url":          _validate_url,
        "email":        _validate_email,
        "tags":         _validate_tags,
        "json":         _validate_json,
        "array":        _validate_array,
    }

    validator = validators.get(field_def.type)
    if validator is None:
        return [ValidationError(
            field=field_def.name,
            message=f"Unknown field type: {field_def.type}",
            value=value,
        )]

    return validator(value, field_def)


def _validate_string(value: Any, field_def: FieldDefinition) -> list[ValidationError]:
    errors: list[ValidationError] = []

    if not isinstance(value, str):
        errors.append(ValidationError(
            field=field_def.name,
            message=f"Expected string, got {type(value).__name__}",
            value=value,
        ))
        return errors  # No point checking constraints on wrong type

    _apply_string_constraints(value, field_def, errors)
    return errors


def _validate_number(value: Any, field_def: FieldDefinition) -> list[ValidationError]:
    errors: list[ValidationError] = []

    # Explicitly reject booleans — bool is a subclass of int in Python
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        errors.append(ValidationError(
            field=field_def.name,
            message=f"Expected number, got {type(value).__name__}",
            value=value,
        ))
        return errors

    import math
    if math.isnan(value):
        errors.append(ValidationError(
            field=field_def.name,
            message="Expected number, got NaN",
            value=value,
        ))
        return errors

    v = field_def.validation
    if v:
        if v.min is not None and value < v.min:
            errors.append(ValidationError(
                field=field_def.name,
                message=f"Value must be >= {v.min}",
                value=value,
            ))
        if v.max is not None and value > v.max:
            errors.append(ValidationError(
                field=field_def.name,
                message=f"Value must be <= {v.max}",
                value=value,
            ))

    return errors


def _validate_boolean(value: Any, field_def: FieldDefinition) -> list[ValidationError]:
    if not isinstance(value, bool):
        return [ValidationError(
            field=field_def.name,
            message=f"Expected boolean, got {type(value).__name__}",
            value=value,
        )]
    return []


def _validate_date(value: Any, field_def: FieldDefinition) -> list[ValidationError]:
    if not isinstance(value, str) or not _ISO8601_RE.match(value):
        return [ValidationError(
            field=field_def.name,
            message="Expected valid ISO 8601 date string",
            value=value,
        )]
    return []


def _validate_select(value: Any, field_def: FieldDefinition) -> list[ValidationError]:
    errors: list[ValidationError] = []

    if not isinstance(value, str):
        errors.append(ValidationError(
            field=field_def.name,
            message=f"Expected string for select, got {type(value).__name__}",
            value=value,
        ))
        return errors

    if field_def.options and value not in field_def.options:
        errors.append(ValidationError(
            field=field_def.name,
            message=f"Value must be one of: {', '.join(field_def.options)}",
            value=value,
        ))

    return errors


def _validate_multi_select(value: Any, field_def: FieldDefinition) -> list[ValidationError]:
    errors: list[ValidationError] = []

    if not isinstance(value, list):
        errors.append(ValidationError(
            field=field_def.name,
            message=f"Expected list for multi-select, got {type(value).__name__}",
            value=value,
        ))
        return errors

    if field_def.options:
        for item in value:
            if item not in field_def.options:
                errors.append(ValidationError(
                    field=field_def.name,
                    message=f"Invalid option: {item!r}. Must be one of: {', '.join(field_def.options)}",
                    value=item,
                ))

    return errors


def _validate_url(value: Any, field_def: FieldDefinition) -> list[ValidationError]:
    if not isinstance(value, str):
        return [ValidationError(
            field=field_def.name,
            message="Expected valid URL (http/https/ws/wss)",
            value=value,
        )]

    try:
        parsed = urlparse(value)
        # Must have http/https/ws/wss scheme and a non-empty netloc (host)
        if parsed.scheme not in ("http", "https", "ws", "wss") or not parsed.netloc:
            raise ValueError
    except Exception:
        return [ValidationError(
            field=field_def.name,
            message="Expected valid URL (http/https/ws/wss)",
            value=value,
        )]

    return []


def _validate_email(value: Any, field_def: FieldDefinition) -> list[ValidationError]:
    if not isinstance(value, str) or not _EMAIL_RE.match(value):
        return [ValidationError(
            field=field_def.name,
            message="Expected valid email address",
            value=value,
        )]
    return []


def _validate_tags(value: Any, field_def: FieldDefinition) -> list[ValidationError]:
    errors: list[ValidationError] = []

    if not isinstance(value, list):
        errors.append(ValidationError(
            field=field_def.name,
            message=f"Expected list for tags, got {type(value).__name__}",
            value=value,
        ))
        return errors

    for tag in value:
        if not isinstance(tag, str):
            errors.append(ValidationError(
                field=field_def.name,
                message="Tag values must be strings",
                value=tag,
            ))

    return errors


def _validate_json(value: Any, field_def: FieldDefinition) -> list[ValidationError]:
    # JSON accepts any value that is serializable — dicts, lists,
    # strings, numbers, booleans, None. Reject only non-serializable types.
    try:
        import json
        json.dumps(value)
    except (TypeError, ValueError):
        return [ValidationError(
            field=field_def.name,
            message="Expected JSON-serializable value",
            value=repr(value),
        )]
    return []


def _validate_array(value: Any, field_def: FieldDefinition) -> list[ValidationError]:
    if not isinstance(value, list):
        return [ValidationError(
            field=field_def.name,
            message=f"Expected list, got {type(value).__name__}",
            value=value,
        )]
    return []


# ─── String Constraint Helpers ────────────────────────────────────────────────

def _apply_string_constraints(
    value: str,
    field_def: FieldDefinition,
    errors: list[ValidationError],
) -> None:
    """Apply minLength, maxLength, and pattern constraints to a string value."""
    v = field_def.validation
    if not v:
        return

    if v.min_length is not None and len(value) < v.min_length:
        errors.append(ValidationError(
            field=field_def.name,
            message=f"Must be at least {v.min_length} characters",
            value=value,
        ))

    if v.max_length is not None and len(value) > v.max_length:
        errors.append(ValidationError(
            field=field_def.name,
            message=f"Must be at most {v.max_length} characters",
            value=value,
        ))

    if v.pattern is not None and not re.search(v.pattern, value):
        errors.append(ValidationError(
            field=field_def.name,
            message=f"Must match pattern: {v.pattern}",
            value=value,
        ))
