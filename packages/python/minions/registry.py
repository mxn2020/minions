"""
Minions SDK — Type Registry
MinionType registry — register, retrieve, and validate types.
Mirrors: packages/core/src/registry/index.ts
"""

from __future__ import annotations

from .types import MinionType
from .schemas import builtin_types


class TypeRegistry:
    """
    An in-memory registry for MinionTypes.
    Pre-loaded with all built-in system types by default.
    """

    def __init__(self, load_builtins: bool = True) -> None:
        self._types: dict[str, MinionType] = {}
        self._slug_index: dict[str, str] = {}

        if load_builtins:
            for t in builtin_types:
                self.register(t)

    def register(self, type: MinionType) -> None:
        """
        Register a MinionType in the registry.
        Raises ValueError if a type with the same id or slug already exists.
        """
        if type.id in self._types:
            raise ValueError(f'Type with id "{type.id}" is already registered')
        if type.slug in self._slug_index:
            raise ValueError(f'Type with slug "{type.slug}" is already registered')
        self._types[type.id] = type
        self._slug_index[type.slug] = type.id

    def get_by_id(self, id: str) -> MinionType | None:
        """Get a type by its ID."""
        return self._types.get(id)

    def get_by_slug(self, slug: str) -> MinionType | None:
        """Get a type by its slug."""
        type_id = self._slug_index.get(slug)
        return self._types.get(type_id) if type_id else None

    def list(self) -> list[MinionType]:
        """List all registered types."""
        return list(self._types.values())

    def has(self, id: str) -> bool:
        """Check if a type exists by ID."""
        return id in self._types

    def remove(self, id: str) -> bool:
        """
        Remove a type from the registry.
        Returns True if the type was removed.
        """
        t = self._types.get(id)
        if t is None:
            return False
        del self._types[id]
        del self._slug_index[t.slug]
        return True
