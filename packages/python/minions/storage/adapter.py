"""
minions.storage.adapter
=======================
Abstract base class and filter type for Minions storage adapters.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional
from dataclasses import dataclass, field

from ..types import Minion


@dataclass
class StorageFilter:
    """Options for filtering the result set when listing minions."""

    #: Only return minions of this type.
    minion_type_id: Optional[str] = None
    #: Only return minions with this status.
    status: Optional[str] = None
    #: When True, include soft-deleted minions. Defaults to False.
    include_deleted: bool = False
    #: Only return minions that have all of the given tags.
    tags: list[str] = field(default_factory=list)
    #: Maximum number of results to return.
    limit: Optional[int] = None
    #: Number of results to skip (for pagination).
    offset: int = 0
    #: Sort results by this field (``createdAt``, ``updatedAt``, or ``title``).
    sort_by: Optional[str] = None
    #: Sort direction (``asc`` or ``desc``). Defaults to ascending.
    sort_order: str = "asc"


class StorageAdapter(ABC):
    """
    Storage adapter abstract base class.

    Every backend implementation must subclass this and implement all abstract
    methods.  All methods are *async* so that adapters backed by remote
    databases work identically to local / in-process ones.
    """

    @abstractmethod
    async def get(self, id: str) -> Optional[Minion]:
        """
        Retrieve a single minion by its ID.
        Returns ``None`` when no matching minion exists.
        """
        ...

    @abstractmethod
    async def set(self, minion: Minion) -> None:
        """
        Persist a minion.
        If a minion with the same ``id`` already exists it is overwritten.
        """
        ...

    @abstractmethod
    async def delete(self, id: str) -> None:
        """
        Remove a minion by its ID.
        Resolves silently even if no matching minion exists.
        """
        ...

    @abstractmethod
    async def list(self, filter: Optional[StorageFilter] = None) -> list[Minion]:
        """List all stored minions, with optional filtering."""
        ...

    @abstractmethod
    async def search(self, query: str) -> list[Minion]:
        """
        Full-text search across stored minions.

        The query is matched case-insensitively against the pre-computed
        ``searchable_text`` field (title + description + string-like fields).
        Returns minions where ``searchable_text`` contains every token in the
        query.
        """
        ...
