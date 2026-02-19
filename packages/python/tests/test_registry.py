"""
Tests for the Minions Python TypeRegistry.
Mirrors: packages/core/src/__tests__/registry.test.ts
"""

import pytest
from minions import TypeRegistry
from minions.schemas import builtin_types, note_type
from minions.types import MinionType


class TestTypeRegistry:
    def test_loads_builtin_types_by_default(self):
        registry = TypeRegistry()
        assert len(registry.list()) == len(builtin_types)

    def test_skips_builtins_when_told(self):
        registry = TypeRegistry(load_builtins=False)
        assert len(registry.list()) == 0

    def test_gets_type_by_id(self):
        registry = TypeRegistry()
        note = registry.get_by_id("builtin-note")
        assert note is not None
        assert note.slug == "note"

    def test_gets_type_by_slug(self):
        registry = TypeRegistry()
        agent = registry.get_by_slug("agent")
        assert agent is not None
        assert agent.id == "builtin-agent"

    def test_registers_custom_types(self):
        registry = TypeRegistry()
        registry.register(MinionType(
            id="custom-1",
            name="Custom",
            slug="custom",
            schema=[],
        ))
        assert registry.get_by_slug("custom") is not None

    def test_throws_on_duplicate_id(self):
        registry = TypeRegistry()
        with pytest.raises(ValueError, match="already registered"):
            registry.register(note_type)

    def test_throws_on_duplicate_slug(self):
        registry = TypeRegistry()
        dup = MinionType(
            id="different-id",
            name=note_type.name,
            slug=note_type.slug,
            schema=note_type.schema,
        )
        with pytest.raises(ValueError, match="already registered"):
            registry.register(dup)

    def test_removes_types(self):
        registry = TypeRegistry()
        assert registry.remove("builtin-note") is True
        assert registry.get_by_id("builtin-note") is None
        assert registry.get_by_slug("note") is None

    def test_returns_false_when_removing_nonexistent(self):
        registry = TypeRegistry()
        assert registry.remove("nonexistent") is False

    def test_checks_existence(self):
        registry = TypeRegistry()
        assert registry.has("builtin-note") is True
        assert registry.has("nonexistent") is False
