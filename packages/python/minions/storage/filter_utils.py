"""
minions.storage.filter_utils
=============================
Shared filtering and sorting logic used by all storage adapters.
"""

from __future__ import annotations

from typing import Optional

from ..types import Minion
from .adapter import StorageFilter


def apply_filter(minions: list[Minion], filter: StorageFilter) -> list[Minion]:
    """
    Apply a :class:`StorageFilter` to a list of minions.

    Handles soft-delete exclusion, field-level filtering (type, status, tags),
    sorting, and pagination (limit / offset).
    """
    result = minions

    if not filter.include_deleted:
        result = [m for m in result if not m.deleted_at]
    if filter.minion_type_id is not None:
        result = [m for m in result if m.minion_type_id == filter.minion_type_id]
    if filter.status is not None:
        result = [m for m in result if m.status == filter.status]
    if filter.tags:
        result = [m for m in result if all(t in (m.tags or []) for t in filter.tags)]

    # ── Sorting ──────────────────────────────────────────────────────────────
    if filter.sort_by:
        reverse = filter.sort_order == "desc"

        def _sort_key(m: Minion) -> str:
            if filter.sort_by == "title":
                return m.title.lower()
            elif filter.sort_by == "createdAt":
                return m.created_at
            elif filter.sort_by == "updatedAt":
                return m.updated_at
            return ""

        result = sorted(result, key=_sort_key, reverse=reverse)

    # ── Pagination ───────────────────────────────────────────────────────────
    result = result[filter.offset:]

    if filter.limit is not None:
        result = result[: filter.limit]

    return result
