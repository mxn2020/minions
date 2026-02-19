"""
Tests for the Minions Python lifecycle utilities.
Mirrors: packages/core/src/__tests__/lifecycle.test.ts
"""

from minions import create_minion, update_minion, soft_delete, hard_delete, restore_minion
from minions import RelationGraph
from minions.schemas import note_type, agent_type
from minions.types import MinionType, FieldDefinition


# ─── createMinion ─────────────────────────────────────────────────────────────

class TestCreateMinion:
    def test_creates_valid_minion(self):
        minion, validation = create_minion(
            {"title": "Test Note", "fields": {"content": "Hello world"}},
            note_type,
        )
        assert validation.valid is True
        assert minion.id is not None
        assert minion.title == "Test Note"
        assert minion.fields["content"] == "Hello world"
        assert minion.status == "active"
        assert minion.created_at is not None
        assert minion.updated_at == minion.created_at

    def test_reports_validation_errors(self):
        _, validation = create_minion(
            {"title": "Bad Note", "fields": {}},
            note_type,
        )
        assert validation.valid is False
        assert len(validation.errors) > 0

    def test_applies_default_values(self):
        type_with_defaults = MinionType(
            id="test-defaults",
            name="Test Defaults",
            slug="test-defaults",
            schema=[
                FieldDefinition(name="content", type="textarea", default_value="default content"),
            ],
        )
        minion, _ = create_minion(
            {"title": "Test", "fields": {}},
            type_with_defaults,
        )
        assert minion.fields["content"] == "default content"

    def test_sets_searchable_text(self):
        minion, _ = create_minion(
            {"title": "My Research Note", "fields": {"content": "Some important CONTENT here"}},
            note_type,
        )
        assert minion.searchable_text is not None
        assert "my research note" in minion.searchable_text
        assert "some important content here" in minion.searchable_text

    def test_includes_tags_in_searchable_text(self):
        type_with_tags = MinionType(
            id="test-tags",
            name="Test Tags",
            slug="test-tags",
            schema=[
                FieldDefinition(name="content", type="textarea"),
                FieldDefinition(name="labels", type="tags"),
            ],
        )
        minion, _ = create_minion(
            {"title": "Tagged", "fields": {"content": "body", "labels": ["alpha", "beta"]}},
            type_with_tags,
        )
        assert "alpha beta" in minion.searchable_text

    def test_includes_description_in_searchable_text(self):
        minion, _ = create_minion(
            {
                "title": "Note Title",
                "description": "An important research finding",
                "fields": {"content": "body text"},
            },
            note_type,
        )
        assert "an important research finding" in minion.searchable_text
        assert "note title" in minion.searchable_text


# ─── updateMinion ─────────────────────────────────────────────────────────────

class TestUpdateMinion:
    def test_updates_fields(self):
        minion, _ = create_minion(
            {"title": "Agent", "fields": {"role": "researcher"}},
            agent_type,
        )
        updated, _ = update_minion(minion, {"fields": {"role": "analyst"}}, agent_type)
        assert updated.fields["role"] == "analyst"
        assert updated.updated_at is not None
        assert updated.updated_at >= minion.updated_at

    def test_updates_title(self):
        minion, _ = create_minion(
            {"title": "Old Title", "fields": {"content": "test"}},
            note_type,
        )
        updated, _ = update_minion(minion, {"title": "New Title"}, note_type)
        assert updated.title == "New Title"

    def test_strips_none_field_values(self):
        minion, _ = create_minion(
            {"title": "Note", "fields": {"content": "hello"}},
            note_type,
        )
        updated, _ = update_minion(minion, {"fields": {"content": None}}, note_type)
        assert "content" not in updated.fields

    def test_preserves_defined_fields_when_stripping(self):
        type_multi = MinionType(
            id="test-multi",
            name="Test Multi",
            slug="test-multi",
            schema=[
                FieldDefinition(name="a", type="string"),
                FieldDefinition(name="b", type="string"),
            ],
        )
        minion, _ = create_minion(
            {"title": "Test", "fields": {"a": "keep", "b": "also keep"}},
            type_multi,
        )
        updated, _ = update_minion(minion, {"fields": {"a": None, "b": "updated"}}, type_multi)
        assert "a" not in updated.fields
        assert updated.fields["b"] == "updated"

    def test_updates_searchable_text(self):
        minion, _ = create_minion(
            {"title": "Original", "fields": {"content": "first version"}},
            note_type,
        )
        assert "first version" in minion.searchable_text

        updated, _ = update_minion(
            minion,
            {"title": "Updated Title", "fields": {"content": "second version"}},
            note_type,
        )
        assert "updated title" in updated.searchable_text
        assert "second version" in updated.searchable_text
        assert "original" not in updated.searchable_text


# ─── softDelete ───────────────────────────────────────────────────────────────

class TestSoftDelete:
    def test_sets_deleted_at(self):
        minion, _ = create_minion(
            {"title": "Note", "fields": {"content": "test"}},
            note_type,
        )
        deleted = soft_delete(minion, "user-1")
        assert deleted.deleted_at is not None
        assert deleted.deleted_by == "user-1"

    def test_same_timestamp_for_deleted_and_updated(self):
        minion, _ = create_minion(
            {"title": "Note", "fields": {"content": "test"}},
            note_type,
        )
        deleted = soft_delete(minion)
        assert deleted.deleted_at == deleted.updated_at


# ─── hardDelete ───────────────────────────────────────────────────────────────

class TestHardDelete:
    def test_removes_all_relations(self):
        m1, _ = create_minion({"title": "Source", "fields": {"content": "a"}}, note_type)
        m2, _ = create_minion({"title": "Target", "fields": {"content": "b"}}, note_type)

        graph = RelationGraph()
        graph.add({"source_id": m1.id, "target_id": m2.id, "type": "relates_to"})
        graph.add({"source_id": m2.id, "target_id": m1.id, "type": "depends_on"})

        assert len(graph.list()) == 2

        hard_delete(m1, graph)

        assert len(graph.get_from_source(m1.id)) == 0
        assert len(graph.get_to_target(m1.id)) == 0
        assert len(graph.list()) == 0

    def test_no_throw_when_no_relations(self):
        minion, _ = create_minion({"title": "Lonely", "fields": {"content": "alone"}}, note_type)
        graph = RelationGraph()
        hard_delete(minion, graph)  # should not raise
        assert len(graph.list()) == 0

    def test_only_removes_target_minion_relations(self):
        m1, _ = create_minion({"title": "A", "fields": {"content": "a"}}, note_type)
        m2, _ = create_minion({"title": "B", "fields": {"content": "b"}}, note_type)
        m3, _ = create_minion({"title": "C", "fields": {"content": "c"}}, note_type)

        graph = RelationGraph()
        graph.add({"source_id": m1.id, "target_id": m2.id, "type": "relates_to"})
        graph.add({"source_id": m2.id, "target_id": m3.id, "type": "parent_of"})

        hard_delete(m1, graph)

        assert len(graph.list()) == 1
        assert len(graph.get_from_source(m2.id)) == 1


# ─── restoreMinion ────────────────────────────────────────────────────────────

class TestRestoreMinion:
    def test_clears_deleted_at(self):
        minion, _ = create_minion({"title": "Note", "fields": {"content": "test"}}, note_type)
        deleted = soft_delete(minion)
        restored = restore_minion(deleted)
        assert restored.deleted_at is None
        assert restored.deleted_by is None
