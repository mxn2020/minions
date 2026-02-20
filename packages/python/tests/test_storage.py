"""
Tests for the storage abstraction layer (Python SDK).
"""

from __future__ import annotations

import asyncio
import json
import os
import tempfile
from pathlib import Path
from typing import Optional

import pytest

from minions import (
    MemoryStorageAdapter,
    JsonFileStorageAdapter,
    StorageFilter,
    Minions,
)
from minions.storage.adapter import StorageAdapter
from minions.lifecycle import create_minion
from minions.schemas import note_type, agent_type


# ─── Helper ──────────────────────────────────────────────────────────────────

def make_note(title: str, content: str):
    minion, _ = create_minion({"title": title, "fields": {"content": content}}, note_type)
    return minion


def run(coro):
    """Convenience wrapper to run a coroutine in tests."""
    return asyncio.get_event_loop().run_until_complete(coro)


# ─── Shared adapter tests ─────────────────────────────────────────────────────

class SharedAdapterTests:
    """Mixin providing the shared contract tests for all storage adapters."""

    adapter: StorageAdapter

    def test_returns_none_for_unknown_id(self):
        result = run(self.adapter.get("non-existent"))
        assert result is None

    def test_store_and_retrieve(self):
        minion = make_note("Hello", "World")
        run(self.adapter.set(minion))
        result = run(self.adapter.get(minion.id))
        assert result is not None
        assert result.id == minion.id
        assert result.title == "Hello"

    def test_overwrite_existing(self):
        minion = make_note("Original", "content")
        run(self.adapter.set(minion))
        from dataclasses import replace
        updated = replace(minion, title="Updated")
        run(self.adapter.set(updated))
        result = run(self.adapter.get(minion.id))
        assert result is not None
        assert result.title == "Updated"

    def test_delete(self):
        minion = make_note("To delete", "bye")
        run(self.adapter.set(minion))
        run(self.adapter.delete(minion.id))
        assert run(self.adapter.get(minion.id)) is None

    def test_delete_nonexistent_does_not_raise(self):
        run(self.adapter.delete("does-not-exist"))  # Should not raise

    def test_list_excludes_deleted_by_default(self):
        import dataclasses
        from datetime import datetime, timezone
        m1 = make_note("A", "a")
        m2 = make_note("B", "b")
        m3 = dataclasses.replace(make_note("C", "c"), deleted_at=datetime.now(timezone.utc).isoformat())
        run(self.adapter.set(m1))
        run(self.adapter.set(m2))
        run(self.adapter.set(m3))
        listing = run(self.adapter.list())
        ids = [m.id for m in listing]
        assert m1.id in ids
        assert m2.id in ids
        assert m3.id not in ids

    def test_list_include_deleted(self):
        import dataclasses
        from datetime import datetime, timezone
        deleted = dataclasses.replace(make_note("Deleted", "gone"), deleted_at=datetime.now(timezone.utc).isoformat())
        run(self.adapter.set(deleted))
        listing = run(self.adapter.list(StorageFilter(include_deleted=True)))
        assert deleted.id in [m.id for m in listing]

    def test_filter_by_minion_type_id(self):
        note = make_note("Note", "note content")
        agent, _ = create_minion({"title": "Agent", "fields": {"role": "tester", "model": "gpt-4"}}, agent_type)
        run(self.adapter.set(note))
        run(self.adapter.set(agent))
        notes = run(self.adapter.list(StorageFilter(minion_type_id=note_type.id)))
        assert all(m.minion_type_id == note_type.id for m in notes)
        note_ids = [m.id for m in notes]
        assert note.id in note_ids
        assert agent.id not in note_ids

    def test_filter_by_status(self):
        import dataclasses
        active = make_note("Active", "a")
        completed = dataclasses.replace(make_note("Completed", "c"), status="completed")
        run(self.adapter.set(active))
        run(self.adapter.set(completed))
        results = run(self.adapter.list(StorageFilter(status="completed")))
        assert all(m.status == "completed" for m in results)
        ids = [m.id for m in results]
        assert completed.id in ids
        assert active.id not in ids

    def test_filter_by_tags(self):
        import dataclasses
        tagged = dataclasses.replace(make_note("Tagged", "x"), tags=["ai", "research"])
        other = dataclasses.replace(make_note("Other", "y"), tags=["ai"])
        run(self.adapter.set(tagged))
        run(self.adapter.set(other))
        results = run(self.adapter.list(StorageFilter(tags=["ai", "research"])))
        ids = [m.id for m in results]
        assert tagged.id in ids
        assert other.id not in ids

    def test_limit_and_offset(self):
        for i in range(5):
            run(self.adapter.set(make_note(f"Note {i}", f"content {i}")))
        page = run(self.adapter.list(StorageFilter(limit=2, offset=1)))
        assert len(page) == 2

    def test_search_by_keyword(self):
        m1 = make_note("Research Paper", "quantum computing concepts")
        m2 = make_note("Shopping List", "milk eggs bread")
        run(self.adapter.set(m1))
        run(self.adapter.set(m2))
        results = run(self.adapter.search("quantum"))
        ids = [m.id for m in results]
        assert m1.id in ids
        assert m2.id not in ids

    def test_search_multi_token(self):
        m = make_note("Quantum Mechanics", "advanced physics notes")
        run(self.adapter.set(m))
        found = run(self.adapter.search("quantum mechanics"))
        assert m.id in [r.id for r in found]
        not_found = run(self.adapter.search("quantum chemistry"))
        assert m.id not in [r.id for r in not_found]

    def test_search_excludes_deleted(self):
        import dataclasses
        from datetime import datetime, timezone
        deleted = dataclasses.replace(
            make_note("Deleted Search", "secret content"),
            deleted_at=datetime.now(timezone.utc).isoformat(),
        )
        run(self.adapter.set(deleted))
        results = run(self.adapter.search("secret"))
        assert deleted.id not in [m.id for m in results]

    def test_search_empty_query_returns_all(self):
        m1 = make_note("Alpha", "content")
        m2 = make_note("Beta", "content")
        run(self.adapter.set(m1))
        run(self.adapter.set(m2))
        results = run(self.adapter.search(""))
        assert len(results) >= 2


class TestMemoryStorageAdapter(SharedAdapterTests):
    def setup_method(self):
        self.adapter = MemoryStorageAdapter()


class TestJsonFileStorageAdapterSharedContract:
    """Run shared contract tests for JsonFileStorageAdapter."""

    def setup_method(self):
        self._tmp = tempfile.mkdtemp()
        self.adapter = run(JsonFileStorageAdapter.create(self._tmp))

    def teardown_method(self):
        import shutil
        shutil.rmtree(self._tmp, ignore_errors=True)

    # Delegate all shared tests via manual calls (pytest doesn't pick up
    # inherited methods from a mixin when the class doesn't inherit them)
    def test_returns_none_for_unknown_id(self):
        SharedAdapterTests.test_returns_none_for_unknown_id(self)

    def test_store_and_retrieve(self):
        SharedAdapterTests.test_store_and_retrieve(self)

    def test_overwrite_existing(self):
        SharedAdapterTests.test_overwrite_existing(self)

    def test_delete(self):
        SharedAdapterTests.test_delete(self)

    def test_delete_nonexistent_does_not_raise(self):
        SharedAdapterTests.test_delete_nonexistent_does_not_raise(self)

    def test_list_excludes_deleted_by_default(self):
        SharedAdapterTests.test_list_excludes_deleted_by_default(self)

    def test_list_include_deleted(self):
        SharedAdapterTests.test_list_include_deleted(self)

    def test_filter_by_minion_type_id(self):
        SharedAdapterTests.test_filter_by_minion_type_id(self)

    def test_filter_by_status(self):
        SharedAdapterTests.test_filter_by_status(self)

    def test_filter_by_tags(self):
        SharedAdapterTests.test_filter_by_tags(self)

    def test_limit_and_offset(self):
        SharedAdapterTests.test_limit_and_offset(self)

    def test_search_by_keyword(self):
        SharedAdapterTests.test_search_by_keyword(self)

    def test_search_multi_token(self):
        SharedAdapterTests.test_search_multi_token(self)

    def test_search_excludes_deleted(self):
        SharedAdapterTests.test_search_excludes_deleted(self)

    def test_search_empty_query_returns_all(self):
        SharedAdapterTests.test_search_empty_query_returns_all(self)


class TestJsonFileStorageAdapterSpecific:
    """JsonFileStorageAdapter-specific tests."""

    def setup_method(self):
        self._tmp = tempfile.mkdtemp()

    def teardown_method(self):
        import shutil
        shutil.rmtree(self._tmp, ignore_errors=True)

    def test_persists_across_instances(self):
        adapter1 = run(JsonFileStorageAdapter.create(self._tmp))
        minion = make_note("Persistent", "should survive reload")
        run(adapter1.set(minion))

        adapter2 = run(JsonFileStorageAdapter.create(self._tmp))
        loaded = run(adapter2.get(minion.id))
        assert loaded is not None
        assert loaded.id == minion.id
        assert loaded.title == "Persistent"

    def test_sharded_file_path(self):
        adapter = run(JsonFileStorageAdapter.create(self._tmp))
        minion = make_note("Sharded", "test")
        run(adapter.set(minion))

        hex_id = minion.id.replace("-", "")
        l1 = hex_id[:2]
        l2 = hex_id[2:4]
        expected = Path(self._tmp) / l1 / l2 / f"{minion.id}.json"
        assert expected.exists()

    def test_creates_root_dir_if_missing(self):
        nested = os.path.join(self._tmp, "deep", "path")
        adapter = run(JsonFileStorageAdapter.create(nested))
        minion = make_note("Deep", "dir")
        run(adapter.set(minion))  # Should not raise

    def test_json_is_human_readable(self):
        adapter = run(JsonFileStorageAdapter.create(self._tmp))
        minion = make_note("Readable", "pretty printed")
        run(adapter.set(minion))

        hex_id = minion.id.replace("-", "")
        path = Path(self._tmp) / hex_id[:2] / hex_id[2:4] / f"{minion.id}.json"
        raw = path.read_text()
        # Should be pretty-printed (indented)
        assert "\n" in raw
        data = json.loads(raw)
        assert data["id"] == minion.id


# ─── Minions client storage integration ──────────────────────────────────────

class TestMinionsClientWithStorage:
    def setup_method(self):
        self.storage = MemoryStorageAdapter()
        self.minions = Minions(storage=self.storage)

    def test_save_and_load(self):
        wrapper = self.minions.create("note", {"title": "Stored Note", "fields": {"content": "hello"}})
        run(self.minions.save(wrapper.data))
        loaded = run(self.minions.load(wrapper.data.id))
        assert loaded is not None
        assert loaded.title == "Stored Note"

    def test_remove_from_storage_and_graph(self):
        a = self.minions.create("note", {"title": "A", "fields": {"content": "a"}})
        b = self.minions.create("note", {"title": "B", "fields": {"content": "b"}})
        a.link_to(b.data.id, "relates_to")
        run(self.minions.save(a.data))
        run(self.minions.save(b.data))

        run(self.minions.remove(a.data))

        assert run(self.minions.load(a.data.id)) is None
        assert len(self.minions.graph.get_from_source(a.data.id)) == 0

    def test_list_and_search_minions(self):
        n1 = self.minions.create("note", {"title": "Machine Learning", "fields": {"content": "neural networks"}})
        n2 = self.minions.create("note", {"title": "Cooking", "fields": {"content": "pasta recipe"}})
        run(self.minions.save(n1.data))
        run(self.minions.save(n2.data))

        all_minions = run(self.minions.list_minions())
        assert len(all_minions) == 2

        found = run(self.minions.search_minions("neural"))
        assert len(found) == 1
        assert found[0].id == n1.data.id

    def test_raises_without_adapter(self):
        minions = Minions()
        n = minions.create("note", {"title": "X", "fields": {"content": "y"}})

        with pytest.raises(RuntimeError, match="No storage adapter configured"):
            run(minions.save(n.data))
        with pytest.raises(RuntimeError, match="No storage adapter configured"):
            run(minions.load("any-id"))
        with pytest.raises(RuntimeError, match="No storage adapter configured"):
            run(minions.remove(n.data))
        with pytest.raises(RuntimeError, match="No storage adapter configured"):
            run(minions.list_minions())
        with pytest.raises(RuntimeError, match="No storage adapter configured"):
            run(minions.search_minions("query"))
