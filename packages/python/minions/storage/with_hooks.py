"""
minions.storage.with_hooks
==========================
Decorating proxy that wraps a :class:`StorageAdapter` with before/after hooks.

This is a lightweight alternative to full client-level middleware when you
only need to intercept storage operations (get, set, delete, list, search).

Example::

    from minions.storage import with_hooks, MemoryStorageAdapter

    async def on_before_set(minion):
        print("Saving:", minion.title)
        return minion

    storage = with_hooks(MemoryStorageAdapter(), StorageHooks(before_set=on_before_set))
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Awaitable, Callable, Optional

from ..types import Minion
from .adapter import StorageAdapter, StorageFilter


# ─── Hook Definitions ────────────────────────────────────────────────────────

@dataclass
class StorageHooks:
    """Optional hooks that fire before/after each storage operation.

    - ``before_*`` hooks run before the underlying adapter method.
      ``before_set`` may return a transformed :class:`Minion` to persist instead.
    - ``after_*`` hooks run after the underlying adapter method completes.
    """

    before_get: Optional[Callable[[str], Awaitable[None]]] = None
    after_get: Optional[Callable[[str, Optional[Minion]], Awaitable[None]]] = None

    before_set: Optional[Callable[[Minion], Awaitable[Optional[Minion]]]] = None
    after_set: Optional[Callable[[Minion], Awaitable[None]]] = None

    before_delete: Optional[Callable[[str], Awaitable[None]]] = None
    after_delete: Optional[Callable[[str], Awaitable[None]]] = None

    before_list: Optional[Callable[[Optional[StorageFilter]], Awaitable[None]]] = None
    after_list: Optional[Callable[[list[Minion], Optional[StorageFilter]], Awaitable[None]]] = None

    before_search: Optional[Callable[[str], Awaitable[None]]] = None
    after_search: Optional[Callable[[list[Minion], str], Awaitable[None]]] = None


# ─── Factory ──────────────────────────────────────────────────────────────────


class _HookedStorageAdapter(StorageAdapter):
    """Internal storage adapter that delegates to an inner adapter with hooks."""

    def __init__(self, inner: StorageAdapter, hooks: StorageHooks):
        self._inner = inner
        self._hooks = hooks

    async def get(self, id: str) -> Optional[Minion]:
        if self._hooks.before_get:
            await self._hooks.before_get(id)
        result = await self._inner.get(id)
        if self._hooks.after_get:
            await self._hooks.after_get(id, result)
        return result

    async def set(self, minion: Minion) -> None:
        to_store = minion
        if self._hooks.before_set:
            transformed = await self._hooks.before_set(minion)
            if transformed is not None:
                to_store = transformed
        await self._inner.set(to_store)
        if self._hooks.after_set:
            await self._hooks.after_set(to_store)

    async def delete(self, id: str) -> None:
        if self._hooks.before_delete:
            await self._hooks.before_delete(id)
        await self._inner.delete(id)
        if self._hooks.after_delete:
            await self._hooks.after_delete(id)

    async def list(self, filter: Optional[StorageFilter] = None) -> list[Minion]:
        if self._hooks.before_list:
            await self._hooks.before_list(filter)
        results = await self._inner.list(filter)
        if self._hooks.after_list:
            await self._hooks.after_list(results, filter)
        return results

    async def search(self, query: str) -> list[Minion]:
        if self._hooks.before_search:
            await self._hooks.before_search(query)
        results = await self._inner.search(query)
        if self._hooks.after_search:
            await self._hooks.after_search(results, query)
        return results


def with_hooks(adapter: StorageAdapter, hooks: StorageHooks) -> StorageAdapter:
    """Wrap a :class:`StorageAdapter` with before/after hooks.

    The returned object satisfies the same ``StorageAdapter`` interface, so it
    can be used as a drop-in replacement everywhere a storage adapter is expected.

    Args:
        adapter: The underlying storage adapter to wrap.
        hooks: A :class:`StorageHooks` instance containing optional hooks.

    Returns:
        A new ``StorageAdapter`` that delegates to *adapter* with hooks.
    """
    return _HookedStorageAdapter(adapter, hooks)
