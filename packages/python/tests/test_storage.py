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
    return asyncio.run(coro)


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

    def test_sort_by_title_ascending(self):
        m1 = make_note("Zebra", "z")
        m2 = make_note("Apple", "a")
        m3 = make_note("Mango", "m")
        run(self.adapter.set(m1))
        run(self.adapter.set(m2))
        run(self.adapter.set(m3))
        results = run(self.adapter.list(StorageFilter(sort_by="title", sort_order="asc")))
        titles = [m.title for m in results]
        assert titles == sorted(titles, key=str.lower)

    def test_sort_by_title_descending(self):
        m1 = make_note("Zebra", "z")
        m2 = make_note("Apple", "a")
        m3 = make_note("Mango", "m")
        run(self.adapter.set(m1))
        run(self.adapter.set(m2))
        run(self.adapter.set(m3))
        results = run(self.adapter.list(StorageFilter(sort_by="title", sort_order="desc")))
        titles = [m.title for m in results]
        assert titles == sorted(titles, key=str.lower, reverse=True)

    def test_sort_combined_with_limit_and_offset(self):
        m1 = make_note("Zebra", "z")
        m2 = make_note("Apple", "a")
        m3 = make_note("Mango", "m")
        run(self.adapter.set(m1))
        run(self.adapter.set(m2))
        run(self.adapter.set(m3))
        # Sort by title asc => Apple, Mango, Zebra — take 1 from offset 1 => Mango
        page = run(self.adapter.list(StorageFilter(sort_by="title", sort_order="asc", limit=1, offset=1)))
        assert len(page) == 1
        assert page[0].title == "Mango"


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

    def test_sort_by_title_ascending(self):
        SharedAdapterTests.test_sort_by_title_ascending(self)

    def test_sort_by_title_descending(self):
        SharedAdapterTests.test_sort_by_title_descending(self)

    def test_sort_combined_with_limit_and_offset(self):
        SharedAdapterTests.test_sort_combined_with_limit_and_offset(self)


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
        wrapper = run(self.minions.create("note", {"title": "Stored Note", "fields": {"content": "hello"}}))
        run(self.minions.save(wrapper.data))
        loaded = run(self.minions.load(wrapper.data.id))
        assert loaded is not None
        assert loaded.title == "Stored Note"

    def test_remove_from_storage_and_graph(self):
        a = run(self.minions.create("note", {"title": "A", "fields": {"content": "a"}}))
        b = run(self.minions.create("note", {"title": "B", "fields": {"content": "b"}}))
        a.link_to(b.data.id, "relates_to")
        run(self.minions.save(a.data))
        run(self.minions.save(b.data))

        run(self.minions.remove(a.data))

        assert run(self.minions.load(a.data.id)) is None
        assert len(self.minions.graph.get_from_source(a.data.id)) == 0

    def test_list_and_search_minions(self):
        n1 = run(self.minions.create("note", {"title": "Machine Learning", "fields": {"content": "neural networks"}}))
        n2 = run(self.minions.create("note", {"title": "Cooking", "fields": {"content": "pasta recipe"}}))
        run(self.minions.save(n1.data))
        run(self.minions.save(n2.data))

        all_minions = run(self.minions.list_minions())
        assert len(all_minions) == 2

        found = run(self.minions.search_minions("neural"))
        assert len(found) == 1
        assert found[0].id == n1.data.id

    def test_raises_without_adapter(self):
        minions = Minions()
        n = run(minions.create("note", {"title": "X", "fields": {"content": "y"}}))

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


# ─── with_hooks storage proxy tests ──────────────────────────────────────────

class TestWithHooks:
    def setup_method(self):
        self.inner = MemoryStorageAdapter()

    def test_passthrough_no_hooks(self):
        from minions.storage import with_hooks, StorageHooks
        hooked = with_hooks(self.inner, StorageHooks())
        minion = make_note("Passthrough", "content")
        run(hooked.set(minion))
        loaded = run(hooked.get(minion.id))
        assert loaded is not None
        assert loaded.title == "Passthrough"

    def test_before_set_transform(self):
        import dataclasses
        from minions.storage import with_hooks, StorageHooks

        async def transform(minion):
            return dataclasses.replace(minion, title=minion.title.upper())

        hooked = with_hooks(self.inner, StorageHooks(before_set=transform))
        minion = make_note("hello", "world")
        run(hooked.set(minion))
        loaded = run(self.inner.get(minion.id))
        assert loaded.title == "HELLO"

    def test_after_set_callback(self):
        from minions.storage import with_hooks, StorageHooks
        captured = [None]

        async def on_after(minion):
            captured[0] = minion

        hooked = with_hooks(self.inner, StorageHooks(after_set=on_after))
        minion = make_note("AfterSet", "test")
        run(hooked.set(minion))
        assert captured[0] is not None
        assert captured[0].title == "AfterSet"

    def test_before_and_after_get(self):
        from minions.storage import with_hooks, StorageHooks
        log = []

        async def before(id):
            log.append(f"before:{id}")

        async def after(id, result):
            log.append(f"after:{id}:{result.title if result else 'None'}")

        hooked = with_hooks(self.inner, StorageHooks(before_get=before, after_get=after))
        minion = make_note("GetHooks", "data")
        run(self.inner.set(minion))

        run(hooked.get(minion.id))
        run(hooked.get("nonexistent"))

        assert log == [
            f"before:{minion.id}",
            f"after:{minion.id}:GetHooks",
            "before:nonexistent",
            "after:nonexistent:None",
        ]

    def test_before_and_after_delete(self):
        from minions.storage import with_hooks, StorageHooks
        log = []

        async def before(id):
            log.append(f"before:{id}")

        async def after(id):
            log.append(f"after:{id}")

        hooked = with_hooks(self.inner, StorageHooks(before_delete=before, after_delete=after))
        minion = make_note("DeleteHooks", "data")
        run(self.inner.set(minion))
        run(hooked.delete(minion.id))

        assert log == [f"before:{minion.id}", f"after:{minion.id}"]
        assert run(self.inner.get(minion.id)) is None

    def test_after_list(self):
        from minions.storage import with_hooks, StorageHooks
        count = [0]

        async def on_after(results, _filter):
            count[0] = len(results)

        hooked = with_hooks(self.inner, StorageHooks(after_list=on_after))
        run(self.inner.set(make_note("A", "a")))
        run(self.inner.set(make_note("B", "b")))
        run(hooked.list())
        assert count[0] == 2

    def test_before_and_after_search(self):
        from minions.storage import with_hooks, StorageHooks
        query_log = [None]
        count = [0]

        async def before(query):
            query_log[0] = query

        async def after(results, query):
            count[0] = len(results)

        hooked = with_hooks(self.inner, StorageHooks(before_search=before, after_search=after))
        run(self.inner.set(make_note("Quantum Physics", "entanglement")))
        run(hooked.search("quantum"))

        assert query_log[0] == "quantum"
        assert count[0] == 1

    def test_hook_error_propagation(self):
        from minions.storage import with_hooks, StorageHooks

        async def failing(_minion):
            raise RuntimeError("Hook failed")

        hooked = with_hooks(self.inner, StorageHooks(before_set=failing))
        with pytest.raises(RuntimeError, match="Hook failed"):
            run(hooked.set(make_note("Error", "test")))

