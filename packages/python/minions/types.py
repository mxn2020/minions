"""
Minions SDK — Core Type Definitions
All type definitions for the Minions structured object system.
Mirrors: packages/core/src/types/index.ts
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal, Optional, Protocol, runtime_checkable

# ─── Literal Types ────────────────────────────────────────────────────────────

FieldType = Literal[
    "string", "number", "boolean", "date", "select",
    "multi-select", "url", "email", "textarea", "tags", "json", "array",
]

RelationType = Literal[
    "parent_of", "depends_on", "implements", "relates_to",
    "inspired_by", "triggers", "references", "blocks",
    "alternative_to", "part_of", "follows", "integration_link",
]

MinionStatus = Literal["active", "todo", "in_progress", "completed", "cancelled"]
MinionPriority = Literal["low", "medium", "high", "urgent"]


# ─── Serialisation Helpers ────────────────────────────────────────────────────

def _to_camel(name: str) -> str:
    """Convert snake_case to camelCase."""
    parts = name.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def _to_snake(name: str) -> str:
    """Convert camelCase to snake_case."""
    import re
    return re.sub(r"(?<=[a-z0-9])([A-Z])", r"_\1", name).lower()


def _dict_to_camel(d: dict[str, Any]) -> dict[str, Any]:
    """Recursively convert dict keys from snake_case to camelCase."""
    out: dict[str, Any] = {}
    for k, v in d.items():
        ck = _to_camel(k)
        if isinstance(v, dict):
            out[ck] = _dict_to_camel(v)
        elif isinstance(v, list):
            out[ck] = [_dict_to_camel(i) if isinstance(i, dict) else i for i in v]
        else:
            out[ck] = v
    return out


def _dict_to_snake(d: dict[str, Any]) -> dict[str, Any]:
    """Recursively convert dict keys from camelCase to snake_case."""
    out: dict[str, Any] = {}
    for k, v in d.items():
        sk = _to_snake(k)
        if isinstance(v, dict):
            out[sk] = _dict_to_snake(v)
        elif isinstance(v, list):
            out[sk] = [_dict_to_snake(i) if isinstance(i, dict) else i for i in v]
        else:
            out[sk] = v
    return out


# ─── Field Definitions ───────────────────────────────────────────────────────

@dataclass
class FieldValidation:
    """Validation constraints for a field."""
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    min: Optional[float] = None
    max: Optional[float] = None
    pattern: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {}
        if self.min_length is not None:
            d["minLength"] = self.min_length
        if self.max_length is not None:
            d["maxLength"] = self.max_length
        if self.min is not None:
            d["min"] = self.min
        if self.max is not None:
            d["max"] = self.max
        if self.pattern is not None:
            d["pattern"] = self.pattern
        return d

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> FieldValidation:
        return cls(
            min_length=d.get("minLength") or d.get("min_length"),
            max_length=d.get("maxLength") or d.get("max_length"),
            min=d.get("min"),
            max=d.get("max"),
            pattern=d.get("pattern"),
        )


@dataclass
class FieldDefinition:
    """Definition of a single field within a MinionType schema."""
    name: str
    type: FieldType
    label: Optional[str] = None
    description: Optional[str] = None
    required: bool = False
    default_value: Any = None
    options: Optional[list[str]] = None
    validation: Optional[FieldValidation] = None

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {"name": self.name, "type": self.type}
        if self.label is not None:
            d["label"] = self.label
        if self.description is not None:
            d["description"] = self.description
        if self.required:
            d["required"] = True
        if self.default_value is not None:
            d["defaultValue"] = self.default_value
        if self.options is not None:
            d["options"] = self.options
        if self.validation is not None:
            d["validation"] = self.validation.to_dict()
        return d

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> FieldDefinition:
        v = d.get("validation")
        return cls(
            name=d["name"],
            type=d["type"],
            label=d.get("label"),
            description=d.get("description"),
            required=d.get("required", False),
            default_value=d.get("defaultValue") or d.get("default_value"),
            options=d.get("options"),
            validation=FieldValidation.from_dict(v) if v else None,
        )


# ─── Core Primitives ─────────────────────────────────────────────────────────

@dataclass
class Minion:
    """A structured object instance — the fundamental unit of the system."""
    id: str
    title: str
    minion_type_id: str
    fields: dict[str, Any]
    created_at: str
    updated_at: str
    tags: Optional[list[str]] = None
    status: Optional[MinionStatus] = "active"
    priority: Optional[MinionPriority] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    category_id: Optional[str] = None
    folder_id: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    deleted_at: Optional[str] = None
    deleted_by: Optional[str] = None
    searchable_text: Optional[str] = None
    _legacy: Optional[dict[str, Any]] = field(default=None, metadata={"alias": "_legacy"})

    def to_dict(self) -> dict[str, Any]:
        """Serialize to a camelCase dict compatible with the TS SDK."""
        d: dict[str, Any] = {
            "id": self.id,
            "title": self.title,
            "minionTypeId": self.minion_type_id,
            "fields": self.fields,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
        if self.tags is not None:
            d["tags"] = self.tags
        if self.status is not None:
            d["status"] = self.status
        if self.priority is not None:
            d["priority"] = self.priority
        if self.description is not None:
            d["description"] = self.description
        if self.due_date is not None:
            d["dueDate"] = self.due_date
        if self.category_id is not None:
            d["categoryId"] = self.category_id
        if self.folder_id is not None:
            d["folderId"] = self.folder_id
        if self.created_by is not None:
            d["createdBy"] = self.created_by
        if self.updated_by is not None:
            d["updatedBy"] = self.updated_by
        if self.deleted_at is not None:
            d["deletedAt"] = self.deleted_at
        if self.deleted_by is not None:
            d["deletedBy"] = self.deleted_by
        if self.searchable_text is not None:
            d["searchableText"] = self.searchable_text
        if self._legacy is not None:
            d["_legacy"] = self._legacy
        return d

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Minion:
        """Deserialize from a camelCase dict (e.g. JSON from the TS SDK)."""
        return cls(
            id=d["id"],
            title=d["title"],
            minion_type_id=d.get("minionTypeId") or d.get("minion_type_id", ""),
            fields=d.get("fields", {}),
            created_at=d.get("createdAt") or d.get("created_at", ""),
            updated_at=d.get("updatedAt") or d.get("updated_at", ""),
            tags=d.get("tags"),
            status=d.get("status"),
            priority=d.get("priority"),
            description=d.get("description"),
            due_date=d.get("dueDate") or d.get("due_date"),
            category_id=d.get("categoryId") or d.get("category_id"),
            folder_id=d.get("folderId") or d.get("folder_id"),
            created_by=d.get("createdBy") or d.get("created_by"),
            updated_by=d.get("updatedBy") or d.get("updated_by"),
            deleted_at=d.get("deletedAt") or d.get("deleted_at"),
            deleted_by=d.get("deletedBy") or d.get("deleted_by"),
            searchable_text=d.get("searchableText") or d.get("searchable_text"),
            _legacy=d.get("_legacy"),
        )


@dataclass
class MinionType:
    """A MinionType defines the schema and behavior of a kind of minion."""
    id: str
    name: str
    slug: str
    schema: list[FieldDefinition]
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_system: bool = False
    is_organizational: bool = False
    allowed_child_types: Optional[list[str]] = None
    behaviors: Optional[list[str]] = None
    default_view: Optional[str] = None
    available_views: Optional[list[str]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "schema": [f.to_dict() for f in self.schema],
        }
        if self.description is not None:
            d["description"] = self.description
        if self.icon is not None:
            d["icon"] = self.icon
        if self.color is not None:
            d["color"] = self.color
        if self.is_system:
            d["isSystem"] = True
        if self.is_organizational:
            d["isOrganizational"] = True
        if self.allowed_child_types is not None:
            d["allowedChildTypes"] = self.allowed_child_types
        if self.behaviors is not None:
            d["behaviors"] = self.behaviors
        if self.default_view is not None:
            d["defaultView"] = self.default_view
        if self.available_views is not None:
            d["availableViews"] = self.available_views
        if self.created_at is not None:
            d["createdAt"] = self.created_at
        if self.updated_at is not None:
            d["updatedAt"] = self.updated_at
        return d

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> MinionType:
        raw_schema = d.get("schema", [])
        schema = [
            FieldDefinition.from_dict(f) if isinstance(f, dict) else f
            for f in raw_schema
        ]
        return cls(
            id=d["id"],
            name=d["name"],
            slug=d["slug"],
            schema=schema,
            description=d.get("description"),
            icon=d.get("icon"),
            color=d.get("color"),
            is_system=d.get("isSystem") or d.get("is_system", False),
            is_organizational=d.get("isOrganizational") or d.get("is_organizational", False),
            allowed_child_types=d.get("allowedChildTypes") or d.get("allowed_child_types"),
            behaviors=d.get("behaviors"),
            default_view=d.get("defaultView") or d.get("default_view"),
            available_views=d.get("availableViews") or d.get("available_views"),
            created_at=d.get("createdAt") or d.get("created_at"),
            updated_at=d.get("updatedAt") or d.get("updated_at"),
        )


@dataclass
class Relation:
    """A typed, directional link between two minions."""
    id: str
    source_id: str
    target_id: str
    type: RelationType
    created_at: str
    metadata: Any = None
    created_by: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {
            "id": self.id,
            "sourceId": self.source_id,
            "targetId": self.target_id,
            "type": self.type,
            "createdAt": self.created_at,
        }
        if self.metadata is not None:
            d["metadata"] = self.metadata
        if self.created_by is not None:
            d["createdBy"] = self.created_by
        return d

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Relation:
        return cls(
            id=d["id"],
            source_id=d.get("sourceId") or d.get("source_id", ""),
            target_id=d.get("targetId") or d.get("target_id", ""),
            type=d["type"],
            created_at=d.get("createdAt") or d.get("created_at", ""),
            metadata=d.get("metadata"),
            created_by=d.get("createdBy") or d.get("created_by"),
        )


# ─── Input Types ──────────────────────────────────────────────────────────────

@dataclass
class CreateMinionInput:
    """Input for creating a new Minion."""
    title: str
    fields: Optional[dict[str, Any]] = None
    tags: Optional[list[str]] = None
    status: Optional[MinionStatus] = None
    priority: Optional[MinionPriority] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    category_id: Optional[str] = None
    folder_id: Optional[str] = None
    created_by: Optional[str] = None


@dataclass
class UpdateMinionInput:
    """Input for updating an existing Minion."""
    title: Optional[str] = None
    fields: Optional[dict[str, Any]] = None
    tags: Optional[list[str]] = None
    status: Optional[MinionStatus] = None
    priority: Optional[MinionPriority] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    category_id: Optional[str] = None
    folder_id: Optional[str] = None
    updated_by: Optional[str] = None


@dataclass
class CreateRelationInput:
    """Input for creating a new Relation."""
    source_id: str
    target_id: str
    type: RelationType
    metadata: Any = None
    created_by: Optional[str] = None


# ─── Execution Contract ──────────────────────────────────────────────────────

@dataclass
class ExecutionResult:
    """Result of executing a minion."""
    output: Any
    status: Literal["completed", "failed", "cancelled"]
    started_at: str
    completed_at: str
    error: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


@runtime_checkable
class Executable(Protocol):
    """Interface that executable minions must satisfy."""
    async def execute(self, input: dict[str, Any]) -> ExecutionResult: ...
