"""
Tests for the Minions Python built-in schemas.
Verifies all 10 types are present and correctly structured.
"""

from minions.schemas import (
    note_type, link_type, file_type, contact_type,
    agent_type, team_type, thought_type, prompt_template_type,
    test_case_type, task_type, builtin_types,
)
from minions.types import MinionType


class TestBuiltinTypes:
    def test_all_10_types_present(self):
        assert len(builtin_types) == 10

    def test_all_are_minion_types(self):
        for t in builtin_types:
            assert isinstance(t, MinionType)

    def test_unique_ids(self):
        ids = [t.id for t in builtin_types]
        assert len(ids) == len(set(ids))

    def test_unique_slugs(self):
        slugs = [t.slug for t in builtin_types]
        assert len(slugs) == len(set(slugs))

    def test_all_system_types(self):
        for t in builtin_types:
            assert t.is_system is True

    def test_note_schema(self):
        assert note_type.slug == "note"
        assert note_type.id == "builtin-note"
        assert len(note_type.schema) == 1
        assert note_type.schema[0].name == "content"
        assert note_type.schema[0].required is True

    def test_agent_schema(self):
        assert agent_type.slug == "agent"
        field_names = [f.name for f in agent_type.schema]
        assert "role" in field_names
        assert "model" in field_names
        assert "systemPrompt" in field_names
        assert "tools" in field_names

    def test_team_is_organizational(self):
        assert team_type.is_organizational is True

    def test_thought_confidence_validation(self):
        conf = next(f for f in thought_type.schema if f.name == "confidence")
        assert conf.validation is not None
        assert conf.validation.min == 0
        assert conf.validation.max == 1

    def test_agent_temperature_validation(self):
        temp = next(f for f in agent_type.schema if f.name == "temperature")
        assert temp.validation is not None
        assert temp.validation.min == 0
        assert temp.validation.max == 2

    def test_task_execution_status_options(self):
        exec_status = next(f for f in task_type.schema if f.name == "executionStatus")
        assert exec_status.options is not None
        assert "pending" in exec_status.options
        assert "completed" in exec_status.options

    def test_prompt_template_output_format_options(self):
        fmt = next(f for f in prompt_template_type.schema if f.name == "outputFormat")
        assert fmt.options is not None
        assert "json" in fmt.options
        assert "markdown" in fmt.options

    def test_link_requires_url(self):
        url_field = next(f for f in link_type.schema if f.name == "url")
        assert url_field.required is True
        assert url_field.type == "url"

    def test_file_requires_filename_and_url(self):
        names = {f.name: f for f in file_type.schema}
        assert names["filename"].required is True
        assert names["fileUrl"].required is True

    def test_contact_requires_name(self):
        name_field = next(f for f in contact_type.schema if f.name == "name")
        assert name_field.required is True

    def test_to_dict_round_trip(self):
        """Verify all built-in types survive a to_dict/from_dict round-trip."""
        for t in builtin_types:
            restored = MinionType.from_dict(t.to_dict())
            assert restored.id == t.id
            assert restored.slug == t.slug
            assert restored.name == t.name
            assert len(restored.schema) == len(t.schema)


class TestSpecVersion:
    def test_spec_version_matches_package(self):
        from minions import SPEC_VERSION
        assert SPEC_VERSION == "0.2.0"

    def test_spec_version_is_semver(self):
        import re
        from minions import SPEC_VERSION
        assert re.match(r"^\d+\.\d+\.\d+", SPEC_VERSION)
