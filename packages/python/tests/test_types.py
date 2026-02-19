"""
Tests for the Minions Python types and serialization.
Verifies to_dict()/from_dict() round-tripping and camelCase interop.
"""

import json
from copy import deepcopy

from minions.types import (
    FieldValidation,
    FieldDefinition,
    Minion,
    MinionType,
    Relation,
)


# ─── FieldValidation ─────────────────────────────────────────────────────────

class TestFieldValidation:
    def test_to_dict_omits_nones(self):
        v = FieldValidation(min_length=5)
        d = v.to_dict()
        assert d == {"minLength": 5}
        assert "maxLength" not in d
        assert "min" not in d

    def test_to_dict_all_fields(self):
        v = FieldValidation(min_length=1, max_length=100, min=0, max=10, pattern="^[a-z]+$")
        d = v.to_dict()
        assert d == {"minLength": 1, "maxLength": 100, "min": 0, "max": 10, "pattern": "^[a-z]+$"}

    def test_from_dict_camel_case(self):
        d = {"minLength": 5, "maxLength": 10}
        v = FieldValidation.from_dict(d)
        assert v.min_length == 5
        assert v.max_length == 10

    def test_from_dict_snake_case(self):
        d = {"min_length": 5, "max_length": 10}
        v = FieldValidation.from_dict(d)
        assert v.min_length == 5
        assert v.max_length == 10

    def test_round_trip(self):
        original = FieldValidation(min_length=2, max_length=50, pattern="^\\w+$")
        restored = FieldValidation.from_dict(original.to_dict())
        assert restored.min_length == original.min_length
        assert restored.max_length == original.max_length
        assert restored.pattern == original.pattern


# ─── FieldDefinition ──────────────────────────────────────────────────────────

class TestFieldDefinition:
    def test_to_dict_minimal(self):
        fd = FieldDefinition(name="role", type="string")
        d = fd.to_dict()
        assert d == {"name": "role", "type": "string"}
        assert "label" not in d
        assert "required" not in d

    def test_to_dict_full(self):
        fd = FieldDefinition(
            name="role", type="select", label="Role",
            required=True, default_value="user", options=["user", "admin"],
            validation=FieldValidation(min_length=1),
        )
        d = fd.to_dict()
        assert d["label"] == "Role"
        assert d["required"] is True
        assert d["defaultValue"] == "user"
        assert d["options"] == ["user", "admin"]
        assert d["validation"] == {"minLength": 1}

    def test_from_dict_camel_case(self):
        d = {"name": "role", "type": "string", "defaultValue": "user", "required": True}
        fd = FieldDefinition.from_dict(d)
        assert fd.default_value == "user"
        assert fd.required is True

    def test_round_trip(self):
        original = FieldDefinition(
            name="email", type="email", label="Email",
            required=True, validation=FieldValidation(pattern="@"),
        )
        restored = FieldDefinition.from_dict(original.to_dict())
        assert restored.name == original.name
        assert restored.type == original.type
        assert restored.label == original.label
        assert restored.required == original.required
        assert restored.validation.pattern == original.validation.pattern


# ─── Minion ───────────────────────────────────────────────────────────────────

class TestMinion:
    def _make_minion(self, **overrides) -> Minion:
        defaults = {
            "id": "test-1",
            "title": "Test Minion",
            "minion_type_id": "builtin-note",
            "fields": {"content": "hello"},
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z",
        }
        defaults.update(overrides)
        return Minion(**defaults)

    def test_to_dict_uses_camel_case(self):
        m = self._make_minion()
        d = m.to_dict()
        assert d["minionTypeId"] == "builtin-note"
        assert d["createdAt"] == "2024-01-01T00:00:00Z"
        assert d["updatedAt"] == "2024-01-01T00:00:00Z"
        assert "minion_type_id" not in d
        assert "created_at" not in d

    def test_to_dict_omits_none_optionals(self):
        m = self._make_minion()
        d = m.to_dict()
        assert "deletedAt" not in d
        assert "deletedBy" not in d
        assert "priority" not in d
        assert "dueDate" not in d

    def test_to_dict_includes_optional_when_set(self):
        m = self._make_minion(
            tags=["a", "b"], priority="high",
            deleted_at="2024-02-01T00:00:00Z",
            _legacy={"old": "val"},
        )
        d = m.to_dict()
        assert d["tags"] == ["a", "b"]
        assert d["priority"] == "high"
        assert d["deletedAt"] == "2024-02-01T00:00:00Z"
        assert d["_legacy"] == {"old": "val"}

    def test_from_dict_camel_case(self):
        d = {
            "id": "test-1", "title": "Test",
            "minionTypeId": "builtin-note",
            "fields": {"content": "hi"},
            "createdAt": "2024-01-01T00:00:00Z",
            "updatedAt": "2024-01-01T00:00:00Z",
            "deletedAt": "2024-02-01T00:00:00Z",
            "searchableText": "test hi",
        }
        m = Minion.from_dict(d)
        assert m.minion_type_id == "builtin-note"
        assert m.deleted_at == "2024-02-01T00:00:00Z"
        assert m.searchable_text == "test hi"

    def test_from_dict_snake_case(self):
        d = {
            "id": "test-1", "title": "Test",
            "minion_type_id": "builtin-note",
            "fields": {}, "created_at": "t", "updated_at": "t",
        }
        m = Minion.from_dict(d)
        assert m.minion_type_id == "builtin-note"

    def test_json_round_trip(self):
        """Test full JSON serialization round-trip (Python → JSON → Python)."""
        original = self._make_minion(
            tags=["tag1"], description="desc",
            _legacy={"old_field": 42},
        )
        json_str = json.dumps(original.to_dict())
        restored = Minion.from_dict(json.loads(json_str))

        assert restored.id == original.id
        assert restored.title == original.title
        assert restored.minion_type_id == original.minion_type_id
        assert restored.fields == original.fields
        assert restored.tags == original.tags
        assert restored.description == original.description
        assert restored._legacy == original._legacy


# ─── MinionType ───────────────────────────────────────────────────────────────

class TestMinionType:
    def test_to_dict_serializes_schema(self):
        mt = MinionType(
            id="custom-1", name="Custom", slug="custom",
            schema=[FieldDefinition(name="a", type="string")],
        )
        d = mt.to_dict()
        assert d["schema"] == [{"name": "a", "type": "string"}]

    def test_from_dict_deserializes_schema(self):
        d = {
            "id": "custom-1", "name": "Custom", "slug": "custom",
            "schema": [{"name": "a", "type": "string", "required": True}],
            "isSystem": True,
        }
        mt = MinionType.from_dict(d)
        assert len(mt.schema) == 1
        assert mt.schema[0].name == "a"
        assert mt.schema[0].required is True
        assert mt.is_system is True

    def test_round_trip(self):
        original = MinionType(
            id="t1", name="T", slug="t",
            schema=[FieldDefinition(name="x", type="number", required=True)],
            is_system=True, icon="🔧",
        )
        restored = MinionType.from_dict(original.to_dict())
        assert restored.id == original.id
        assert restored.is_system is True
        assert restored.icon == "🔧"
        assert restored.schema[0].required is True


# ─── Relation ─────────────────────────────────────────────────────────────────

class TestRelation:
    def test_to_dict_uses_camel_case(self):
        r = Relation(
            id="r1", source_id="a", target_id="b",
            type="parent_of", created_at="2024-01-01T00:00:00Z",
        )
        d = r.to_dict()
        assert d["sourceId"] == "a"
        assert d["targetId"] == "b"
        assert d["createdAt"] == "2024-01-01T00:00:00Z"

    def test_from_dict_camel_case(self):
        d = {
            "id": "r1", "sourceId": "a", "targetId": "b",
            "type": "parent_of", "createdAt": "t",
        }
        r = Relation.from_dict(d)
        assert r.source_id == "a"
        assert r.target_id == "b"

    def test_round_trip(self):
        original = Relation(
            id="r1", source_id="a", target_id="b",
            type="depends_on", created_at="2024-01-01T00:00:00Z",
            metadata={"weight": 0.5}, created_by="user-1",
        )
        restored = Relation.from_dict(original.to_dict())
        assert restored.source_id == original.source_id
        assert restored.metadata == original.metadata
        assert restored.created_by == original.created_by
