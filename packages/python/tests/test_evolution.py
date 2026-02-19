"""
Tests for the Minions Python schema evolution utilities.
Mirrors: packages/core/src/__tests__/evolution.test.ts
"""

from minions import migrate_minion
from minions.types import Minion, FieldDefinition


# ─── Fixtures ─────────────────────────────────────────────────────────────────

_base_minion = Minion(
    id="test-1",
    title="Test",
    minion_type_id="type-1",
    fields={"name": "Alice", "age": 30},
    created_at="2024-01-01T00:00:00Z",
    updated_at="2024-01-01T00:00:00Z",
)

_old_schema = [
    FieldDefinition(name="name", type="string"),
    FieldDefinition(name="age", type="number"),
]


class TestMigrateMinion:
    def test_keeps_fields_that_still_exist(self):
        new_schema = [
            FieldDefinition(name="name", type="string"),
            FieldDefinition(name="age", type="number"),
        ]
        migrated = migrate_minion(_base_minion, _old_schema, new_schema)
        assert migrated.fields["name"] == "Alice"
        assert migrated.fields["age"] == 30

    def test_moves_removed_fields_to_legacy(self):
        new_schema = [
            FieldDefinition(name="name", type="string"),
        ]
        migrated = migrate_minion(_base_minion, _old_schema, new_schema)
        assert "age" not in migrated.fields
        assert migrated._legacy is not None
        assert migrated._legacy["age"] == 30

    def test_moves_incompatible_type_changed_fields_to_legacy(self):
        new_schema = [
            FieldDefinition(name="name", type="number"),  # was string, value is string
            FieldDefinition(name="age", type="number"),
        ]
        migrated = migrate_minion(_base_minion, _old_schema, new_schema)
        assert migrated._legacy is not None
        assert migrated._legacy["name"] == "Alice"
        assert "name" not in migrated.fields

    def test_applies_defaults_for_new_fields(self):
        new_schema = [
            FieldDefinition(name="name", type="string"),
            FieldDefinition(name="age", type="number"),
            FieldDefinition(name="role", type="string", default_value="user"),
        ]
        migrated = migrate_minion(_base_minion, _old_schema, new_schema)
        assert migrated.fields["role"] == "user"

    def test_no_legacy_when_no_fields_moved(self):
        new_schema = [
            FieldDefinition(name="name", type="string"),
            FieldDefinition(name="age", type="number"),
        ]
        migrated = migrate_minion(_base_minion, _old_schema, new_schema)
        assert migrated._legacy is None

    def test_accumulates_legacy_from_previous_migrations(self):
        minion_with_legacy = Minion(
            id=_base_minion.id,
            title=_base_minion.title,
            minion_type_id=_base_minion.minion_type_id,
            fields={"name": "Alice", "age": 30},
            created_at=_base_minion.created_at,
            updated_at=_base_minion.updated_at,
            _legacy={"oldField": "preserved"},
        )
        new_schema = [
            FieldDefinition(name="name", type="string"),
            # age removed — should join existing _legacy
        ]
        migrated = migrate_minion(minion_with_legacy, _old_schema, new_schema)
        assert migrated._legacy is not None
        assert migrated._legacy["oldField"] == "preserved"
        assert migrated._legacy["age"] == 30
