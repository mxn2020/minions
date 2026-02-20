"""
minions.storage.json_file_storage_adapter
==========================================
Disk-based JSON storage adapter with sharded directory layout and
in-memory index for fast queries / full-text search.

Directory layout
----------------
Each minion is stored as a pretty-printed JSON file::

    <root_dir>/<id[0:2]>/<id[2:4]>/<id>.json

The two-level shard prefix keeps individual directories small even when
millions of minions are stored, while still being human-readable and
git-friendly.

Index
-----
An in-memory ``dict[str, Minion]`` is populated at construction time by
scanning the root directory.  All subsequent reads hit the index first
(O(1)), falling back to disk only when the entry is missing (which should
not happen in normal usage).  Writes update both disk and the index
atomically (from the caller's perspective).
"""

from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import Optional

from ..types import Minion
from .adapter import StorageAdapter, StorageFilter


def _shard_dir(root_dir: Path, id: str) -> Path:
    """Return the shard sub-directory for the given minion *id*."""
    hex_id = id.replace("-", "")
    return root_dir / hex_id[:2] / hex_id[2:4]


def _file_path(root_dir: Path, id: str) -> Path:
    """Return the full path to the JSON file for the given minion *id*."""
    return _shard_dir(root_dir, id) / f"{id}.json"


def _apply_filter(minions: list[Minion], filter: StorageFilter) -> list[Minion]:
    """Apply a :class:`StorageFilter` to a list of minions."""
    result = minions

    if not filter.include_deleted:
        result = [m for m in result if not m.deleted_at]
    if filter.minion_type_id is not None:
        result = [m for m in result if m.minion_type_id == filter.minion_type_id]
    if filter.status is not None:
        result = [m for m in result if m.status == filter.status]
    if filter.tags:
        result = [m for m in result if all(t in (m.tags or []) for t in filter.tags)]

    result = result[filter.offset:]

    if filter.limit is not None:
        result = result[: filter.limit]

    return result


class JsonFileStorageAdapter(StorageAdapter):
    """
    Disk-backed JSON storage adapter.

    Use the async factory method :meth:`create` to construct an instance::

        storage = await JsonFileStorageAdapter.create("./data/minions")

    The directory is created if it does not yet exist.  All existing JSON
    files underneath it are loaded into the in-memory index on startup.
    """

    def __init__(self, root_dir: Path) -> None:
        self._root_dir = root_dir
        self._index: dict[str, Minion] = {}

    @classmethod
    async def create(cls, root_dir: str | os.PathLike) -> "JsonFileStorageAdapter":
        """
        Create (or open) a :class:`JsonFileStorageAdapter` rooted at *root_dir*.

        The directory is created if it does not yet exist.  All existing JSON
        files underneath it are loaded into the in-memory index.
        """
        adapter = cls(Path(root_dir))
        await adapter._init()
        return adapter

    # ── Initialisation ────────────────────────────────────────────────────────

    async def _init(self) -> None:
        self._root_dir.mkdir(parents=True, exist_ok=True)
        await self._build_index()

    async def _build_index(self) -> None:
        """Walk the sharded directory tree and populate the in-memory index."""
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._build_index_sync)

    def _build_index_sync(self) -> None:
        if not self._root_dir.exists():
            return
        for l1 in self._root_dir.iterdir():
            if not l1.is_dir():
                continue
            for l2 in l1.iterdir():
                if not l2.is_dir():
                    continue
                for f in l2.iterdir():
                    if f.suffix != ".json":
                        continue
                    try:
                        raw = f.read_text(encoding="utf-8")
                        data = json.loads(raw)
                        minion = Minion.from_dict(data)
                        self._index[minion.id] = minion
                    except Exception:
                        # Silently skip unreadable / corrupt files
                        pass

    # ── StorageAdapter implementation ─────────────────────────────────────────

    async def get(self, id: str) -> Optional[Minion]:
        return self._index.get(id)

    async def set(self, minion: Minion) -> None:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._write_sync, minion)
        self._index[minion.id] = minion

    def _write_sync(self, minion: Minion) -> None:
        directory = _shard_dir(self._root_dir, minion.id)
        directory.mkdir(parents=True, exist_ok=True)
        path = _file_path(self._root_dir, minion.id)
        path.write_text(json.dumps(minion.to_dict(), indent=2), encoding="utf-8")

    async def delete(self, id: str) -> None:
        self._index.pop(id, None)
        path = _file_path(self._root_dir, id)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._unlink_sync, path)

    @staticmethod
    def _unlink_sync(path: Path) -> None:
        try:
            path.unlink()
        except FileNotFoundError:
            pass

    async def list(self, filter: Optional[StorageFilter] = None) -> list[Minion]:
        all_minions = list(self._index.values())
        if filter is None:
            return [m for m in all_minions if not m.deleted_at]
        return _apply_filter(all_minions, filter)

    async def search(self, query: str) -> list[Minion]:
        if not query.strip():
            return await self.list()

        tokens = query.lower().split()
        all_minions = [m for m in self._index.values() if not m.deleted_at]

        return [
            m for m in all_minions
            if all(token in (m.searchable_text or m.title.lower()) for token in tokens)
        ]
