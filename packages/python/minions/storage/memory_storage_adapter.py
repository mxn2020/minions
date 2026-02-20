"""
minions.storage.memory_storage_adapter
=======================================
In-memory storage adapter — useful for testing and ephemeral workloads.
"""

from __future__ import annotations

from typing import Optional

from ..types import Minion
from .adapter import StorageAdapter, StorageFilter
from .filter_utils import apply_filter


class MemoryStorageAdapter(StorageAdapter):
    """
    Simple in-memory storage adapter.

    All data is stored in a ``dict`` and is lost when the process exits.
    This is the default adapter when no persistence is required and is well
    suited for unit tests.
    """

    def __init__(self) -> None:
        self._store: dict[str, Minion] = {}

    async def get(self, id: str) -> Optional[Minion]:
        return self._store.get(id)

    async def set(self, minion: Minion) -> None:
        self._store[minion.id] = minion

    async def delete(self, id: str) -> None:
        self._store.pop(id, None)

    async def list(self, filter: Optional[StorageFilter] = None) -> list[Minion]:
        all_minions = list(self._store.values())
        if filter is None:
            return [m for m in all_minions if not m.deleted_at]
        return apply_filter(all_minions, filter)

    async def search(self, query: str) -> list[Minion]:
        if not query.strip():
            return await self.list()

        tokens = query.lower().split()
        all_minions = [m for m in self._store.values() if not m.deleted_at]

        return [
            m for m in all_minions
            if all(token in (m.searchable_text or m.title).lower() for token in tokens)
        ]
