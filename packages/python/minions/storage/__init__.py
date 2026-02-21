"""
minions.storage
===============
Storage abstraction layer for the Minions structured object system.

The :class:`StorageAdapter` abstract base class is the single contract that
all storage backends must satisfy.  New backends (Postgres, MongoDB,
Supabase, …) can be added later by subclassing ``StorageAdapter`` without
touching the rest of the SDK.
"""

from __future__ import annotations

from .adapter import StorageAdapter, StorageFilter
from .filter_utils import apply_filter
from .memory_storage_adapter import MemoryStorageAdapter
from .json_file_storage_adapter import JsonFileStorageAdapter
from .with_hooks import with_hooks, StorageHooks

__all__ = [
    "StorageAdapter",
    "StorageFilter",
    "apply_filter",
    "MemoryStorageAdapter",
    "JsonFileStorageAdapter",
    "with_hooks",
    "StorageHooks",
]
