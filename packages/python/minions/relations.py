"""
Minions SDK — Relation Graph
Relation graph utilities — manage typed links between minions.
Mirrors: packages/core/src/relations/index.ts
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from .types import Relation, RelationType


def _generate_id() -> str:
    return str(uuid.uuid4())


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class RelationGraph:
    """
    In-memory relation graph manager.
    Provides utilities to add, remove, query, and traverse relations.
    """

    def __init__(self) -> None:
        self._relations: dict[str, Relation] = {}

    def add(self, input: dict[str, Any]) -> Relation:
        """Add a relation to the graph. Returns the created Relation."""
        relation = Relation(
            id=_generate_id(),
            source_id=input.get("source_id") or input.get("sourceId", ""),
            target_id=input.get("target_id") or input.get("targetId", ""),
            type=input["type"],
            created_at=_now(),
            metadata=input.get("metadata"),
            created_by=input.get("created_by") or input.get("createdBy"),
        )
        self._relations[relation.id] = relation
        return relation

    def remove(self, id: str) -> bool:
        """Remove a relation by ID. Returns True if removed."""
        return self._relations.pop(id, None) is not None

    def remove_by_minion_id(self, minion_id: str) -> int:
        """Remove all relations involving a given minion. Returns count removed."""
        to_remove = [
            rid for rid, rel in self._relations.items()
            if rel.source_id == minion_id or rel.target_id == minion_id
        ]
        for rid in to_remove:
            del self._relations[rid]
        return len(to_remove)

    def get(self, id: str) -> Relation | None:
        """Get a relation by ID."""
        return self._relations.get(id)

    def list(self) -> list[Relation]:
        """Get all relations."""
        return list(self._relations.values())

    def get_from_source(self, source_id: str, type: Optional[RelationType] = None) -> list[Relation]:
        """Get all relations where the given minion is the source."""
        return [
            r for r in self._relations.values()
            if r.source_id == source_id and (type is None or r.type == type)
        ]

    def get_to_target(self, target_id: str, type: Optional[RelationType] = None) -> list[Relation]:
        """Get all relations where the given minion is the target."""
        return [
            r for r in self._relations.values()
            if r.target_id == target_id and (type is None or r.type == type)
        ]

    def get_children(self, parent_id: str) -> list[str]:
        """Get children (targets of parent_of relations from this minion)."""
        return [r.target_id for r in self.get_from_source(parent_id, "parent_of")]

    def get_parents(self, child_id: str) -> list[str]:
        """Get parents (sources of parent_of relations to this minion)."""
        return [r.source_id for r in self.get_to_target(child_id, "parent_of")]

    def get_tree(self, root_id: str) -> list[str]:
        """
        Get the full tree of descendants via parent_of relations.
        Returns a flat list of all descendant IDs (depth-first).
        """
        result: list[str] = []
        visited: set[str] = set()
        stack = [root_id]

        while stack:
            current = stack.pop()
            if current in visited:
                continue
            visited.add(current)
            children = self.get_children(current)
            result.extend(children)
            stack.extend(children)

        return result

    def get_network(self, minion_id: str) -> list[str]:
        """Get all minions connected to the given minion (any direction/type)."""
        connected: set[str] = set()
        for rel in self._relations.values():
            if rel.source_id == minion_id:
                connected.add(rel.target_id)
            if rel.target_id == minion_id:
                connected.add(rel.source_id)
        return list(connected)
