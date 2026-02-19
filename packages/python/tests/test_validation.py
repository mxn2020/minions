"""
Tests for the Minions Python validation engine.
Mirrors: packages/core/src/__tests__/validation.test.ts
"""

import pytest
from minions.types import FieldDefinition, FieldValidation
from minions.validation import validate_field, validate_fields, ValidationResult


# ─── Helpers ──────────────────────────────────────────────────────────────────

def field(name: str, type: str, **kwargs) -> FieldDefinition:
    """Shorthand for building a FieldDefinition in tests."""
    validation_kwargs = {
        k: v for k, v in kwargs.items()
        if k in ("min_length", "max_length", "min", "max", "pattern")
    }
    other_kwargs = {
        k: v for k, v in kwargs.items()
        if k not in validation_kwargs
    }
    v = FieldValidation(**validation_kwargs) if validation_kwargs else None
    return FieldDefinition(name=name, type=type, validation=v, **other_kwargs)


def valid(value, f: FieldDefinition):
    return len(validate_field(value, f)) == 0


def invalid(value, f: FieldDefinition):
    return len(validate_field(value, f)) > 0


# ─── Required / Optional ──────────────────────────────────────────────────────

class TestRequiredOptional:
    def test_required_string_passes(self):
        f = field("name", "string", required=True)
        assert valid("hello", f)

    def test_required_string_fails_on_none(self):
        f = field("name", "string", required=True)
        errors = validate_field(None, f)
        assert len(errors) == 1
        assert "required" in errors[0].message

    def test_required_string_fails_on_empty(self):
        f = field("name", "string", required=True)
        errors = validate_field("", f)
        assert len(errors) == 1
        assert "required" in errors[0].message

    def test_optional_absent_passes(self):
        f = field("name", "string")
        assert valid(None, f)
        assert valid("", f)


# ─── String ───────────────────────────────────────────────────────────────────

class TestString:
    def test_valid_string(self):
        assert valid("hello", field("x", "string"))

    def test_rejects_non_string(self):
        assert invalid(123, field("x", "string"))
        assert invalid(True, field("x", "string"))
        assert invalid([], field("x", "string"))

    def test_min_length(self):
        f = field("x", "string", min_length=3)
        assert valid("abc", f)
        assert invalid("ab", f)

    def test_max_length(self):
        f = field("x", "string", max_length=5)
        assert valid("hello", f)
        assert invalid("toolong", f)

    def test_pattern(self):
        f = field("x", "string", pattern=r"^[A-Z]{3}-\d{3}$")
        assert valid("ABC-123", f)
        assert invalid("abc-123", f)
        assert invalid("ABCD-1234", f)

    def test_textarea_same_as_string(self):
        f = field("x", "textarea")
        assert valid("long text here", f)
        assert invalid(123, f)


# ─── Number ───────────────────────────────────────────────────────────────────

class TestNumber:
    def test_valid_int(self):
        assert valid(42, field("x", "number"))

    def test_valid_float(self):
        assert valid(3.14, field("x", "number"))

    def test_rejects_string(self):
        assert invalid("42", field("x", "number"))

    def test_rejects_bool(self):
        # bool is a subclass of int in Python — must be explicitly rejected
        assert invalid(True, field("x", "number"))
        assert invalid(False, field("x", "number"))

    def test_rejects_nan(self):
        assert invalid(float("nan"), field("x", "number"))

    def test_min(self):
        f = field("temp", "number", min=0)
        assert valid(0, f)
        assert valid(1, f)
        assert invalid(-1, f)

    def test_max(self):
        f = field("temp", "number", max=2)
        assert valid(2, f)
        assert invalid(3, f)

    def test_min_max_range(self):
        f = field("temp", "number", min=0, max=2)
        assert valid(1, f)
        assert invalid(-1, f)
        assert invalid(3, f)


# ─── Boolean ──────────────────────────────────────────────────────────────────

class TestBoolean:
    def test_valid_true(self):
        assert valid(True, field("x", "boolean"))

    def test_valid_false(self):
        assert valid(False, field("x", "boolean"))

    def test_rejects_string(self):
        assert invalid("yes", field("x", "boolean"))

    def test_rejects_int(self):
        assert invalid(1, field("x", "boolean"))

    def test_rejects_none(self):
        # None is treated as absent for optional fields — passes
        assert valid(None, field("x", "boolean"))

    def test_rejects_none_when_required(self):
        assert invalid(None, field("x", "boolean", required=True))


# ─── Date ─────────────────────────────────────────────────────────────────────

class TestDate:
    def test_date_only(self):
        assert valid("2024-01-15", field("x", "date"))

    def test_datetime_utc(self):
        assert valid("2024-01-15T10:30:00Z", field("x", "date"))

    def test_datetime_with_millis(self):
        assert valid("2024-01-15T10:30:00.123Z", field("x", "date"))

    def test_datetime_with_offset(self):
        assert valid("2024-06-15T14:30:00+02:00", field("x", "date"))

    def test_rejects_plain_year(self):
        # Lenient parsers accept this — ours should not
        assert invalid("2024", field("x", "date"))

    def test_rejects_garbage(self):
        assert invalid("not-a-date", field("x", "date"))

    def test_rejects_banana(self):
        assert invalid("banana 2024", field("x", "date"))

    def test_rejects_non_string(self):
        assert invalid(20240115, field("x", "date"))


# ─── Select ───────────────────────────────────────────────────────────────────

class TestSelect:
    def test_valid_option(self):
        f = field("color", "select", options=["red", "blue"])
        assert valid("red", f)

    def test_rejects_invalid_option(self):
        f = field("color", "select", options=["red", "blue"])
        assert invalid("green", f)

    def test_rejects_non_string(self):
        f = field("color", "select", options=["red", "blue"])
        assert invalid(1, f)

    def test_no_options_accepts_any_string(self):
        # If options is not set, any string passes
        assert valid("anything", field("x", "select"))


# ─── Multi-Select ─────────────────────────────────────────────────────────────

class TestMultiSelect:
    def test_valid_selection(self):
        f = field("colors", "multi-select", options=["red", "blue"])
        assert valid(["red"], f)
        assert valid(["red", "blue"], f)

    def test_rejects_invalid_option(self):
        f = field("colors", "multi-select", options=["red", "blue"])
        errors = validate_field(["green"], f)
        assert len(errors) == 1

    def test_rejects_non_list(self):
        f = field("colors", "multi-select", options=["red"])
        assert invalid("red", f)

    def test_multiple_invalid_options_give_multiple_errors(self):
        f = field("x", "multi-select", options=["a", "b"])
        errors = validate_field(["x", "y"], f)
        assert len(errors) == 2


# ─── URL ──────────────────────────────────────────────────────────────────────

class TestURL:
    def test_valid_https(self):
        assert valid("https://example.com", field("x", "url"))

    def test_valid_http_with_path(self):
        assert valid("http://example.com/path?q=1", field("x", "url"))

    def test_rejects_ftp(self):
        assert invalid("ftp://example.com", field("x", "url"))

    def test_rejects_empty_host(self):
        assert invalid("https://", field("x", "url"))

    def test_rejects_plain_string(self):
        assert invalid("not-a-url", field("x", "url"))

    def test_rejects_non_string(self):
        assert invalid(123, field("x", "url"))


# ─── Email ────────────────────────────────────────────────────────────────────

class TestEmail:
    def test_valid_email(self):
        assert valid("test@example.com", field("x", "email"))

    def test_rejects_no_at(self):
        assert invalid("not-email", field("x", "email"))

    def test_rejects_no_domain(self):
        assert invalid("test@", field("x", "email"))

    def test_rejects_non_string(self):
        assert invalid(123, field("x", "email"))


# ─── Tags ─────────────────────────────────────────────────────────────────────

class TestTags:
    def test_valid_string_list(self):
        assert valid(["a", "b"], field("x", "tags"))

    def test_empty_list_is_valid(self):
        assert valid([], field("x", "tags"))

    def test_rejects_non_list(self):
        assert invalid("not-a-list", field("x", "tags"))

    def test_rejects_non_string_items(self):
        errors = validate_field([1, 2], field("x", "tags"))
        assert len(errors) == 2


# ─── JSON ─────────────────────────────────────────────────────────────────────

class TestJSON:
    def test_accepts_dict(self):
        assert valid({"key": "value"}, field("x", "json"))

    def test_accepts_list(self):
        assert valid([1, 2, 3], field("x", "json"))

    def test_accepts_string(self):
        assert valid("a string", field("x", "json"))

    def test_accepts_number(self):
        assert valid(42, field("x", "json"))

    def test_accepts_none(self):
        # None is absent, so it passes for optional fields
        assert valid(None, field("x", "json"))

    def test_rejects_non_serializable(self):
        assert invalid(object(), field("x", "json"))


# ─── Array ────────────────────────────────────────────────────────────────────

class TestArray:
    def test_valid_array(self):
        assert valid([1, 2, 3], field("x", "array"))

    def test_empty_array_valid(self):
        assert valid([], field("x", "array"))

    def test_rejects_string(self):
        assert invalid("not-array", field("x", "array"))

    def test_rejects_dict(self):
        assert invalid({"key": "val"}, field("x", "array"))


# ─── validate_fields ──────────────────────────────────────────────────────────

class TestValidateFields:
    def test_valid_schema(self):
        schema = [field("content", "textarea", required=True)]
        result = validate_fields({"content": "hello"}, schema)
        assert result.valid is True
        assert result.errors == []

    def test_collects_all_errors(self):
        schema = [
            field("name", "string", required=True),
            field("email", "email", required=True),
        ]
        result = validate_fields({}, schema)
        assert result.valid is False
        assert len(result.errors) == 2

    def test_returns_validation_result_type(self):
        result = validate_fields({}, [])
        assert isinstance(result, ValidationResult)

    def test_partial_failure(self):
        schema = [
            field("name", "string", required=True),
            field("age", "number"),
        ]
        result = validate_fields({"name": "Alice", "age": "not-a-number"}, schema)
        assert result.valid is False
        assert len(result.errors) == 1
        assert result.errors[0].field == "age"

    def test_to_dict(self):
        schema = [field("name", "string", required=True)]
        result = validate_fields({}, schema)
        d = result.to_dict()
        assert d["valid"] is False
        assert isinstance(d["errors"], list)
        assert d["errors"][0]["field"] == "name"
