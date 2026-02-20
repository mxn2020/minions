from typing import Dict, List, Optional, Any
from ..types import Minion, MinionType, CreateMinionInput, UpdateMinionInput, RelationType
from ..registry import TypeRegistry
from ..relations import RelationGraph
from ..lifecycle import create_minion, update_minion, soft_delete, hard_delete, restore_minion
from ..storage.adapter import StorageAdapter, StorageFilter
from .plugin import MinionPlugin

class MinionWrapper:
    """Enhanced Wrapper for a Minion instance that provides chainable, instance-level methods."""
    def __init__(self, data: Minion, client: "Minions"):
        self.data = data
        self.client = client
        
    def link_to(self, target_id: str, relation_type: str) -> "MinionWrapper":
        """Create a directed relation from this minion to a target minion."""
        self.client.graph.add({
            "sourceId": self.data.id,
            "targetId": target_id,
            "type": relation_type
        })
        return self

class Minions:
    """
    Central Client facade for the Minions ecosystem.
    Orchestrates TypeRegistry and RelationGraph directly, and supports plugin mounting.

    Pass a ``storage`` adapter to enable minion persistence::

        storage = await JsonFileStorageAdapter.create("./data/minions")
        minions = Minions(storage=storage)
        wrapper = minions.create("note", {"title": "Hello", "fields": {"content": "World"}})
        await minions.save(wrapper.data)
    """
    registry: TypeRegistry
    graph: RelationGraph

    def __init__(self, plugins: Optional[List[MinionPlugin]] = None, storage: Optional[StorageAdapter] = None):
        self.registry = TypeRegistry()
        self.graph = RelationGraph()
        self.storage: Optional[StorageAdapter] = storage

        if plugins:
            for plugin in plugins:
                setattr(self, plugin.namespace, plugin.init(self))
                
    def create(self, type_slug: str, input_data: CreateMinionInput) -> MinionWrapper:
        """
        Creates a new minion and returns an enhanced MinionWrapper.
        Looks up the appropriate schema from the internal TypeRegistry using the slug.
        """
        minion_type = self.registry.get_by_slug(type_slug)
        if not minion_type:
            raise ValueError(f"MinionType with slug '{type_slug}' not found in registry.")
            
        minion, validation = create_minion(input_data, minion_type)
        if not validation.valid:
            errors = "\n".join([f"- {e.field}: {e.message}" for e in validation.errors])
            raise ValueError(f"Validation failed for '{type_slug}':\n{errors}")
            
        return MinionWrapper(minion, self)
        
    def update(self, minion: Minion, input_data: UpdateMinionInput) -> MinionWrapper:
        """Updates an existing minion's data."""
        minion_type = self.registry.get_by_id(minion.minion_type_id)
        if not minion_type:
            raise ValueError(f"MinionType '{minion.minion_type_id}' not found in registry.")
            
        updated_minion, validation = update_minion(minion, input_data, minion_type)
        if not validation.valid:
            errors = "\n".join([f"- {e.field}: {e.message}" for e in validation.errors])
            raise ValueError(f"Validation failed for update:\n{errors}")
            
        return MinionWrapper(updated_minion, self)

    def soft_delete(self, minion: Minion) -> MinionWrapper:
        """Soft deletes a minion."""
        return MinionWrapper(soft_delete(minion), self)
        
    def hard_delete(self, minion: Minion) -> None:
        """
        Hard deletes a minion from the relation graph.
        Note: This does not remove it from your external storage.
        """
        hard_delete(minion, self.graph)
        
    def restore(self, minion: Minion) -> MinionWrapper:
        """Restores a soft-deleted minion."""
        return MinionWrapper(restore_minion(minion), self)

    # ── Storage helpers ────────────────────────────────────────────────────────

    def _require_storage(self) -> StorageAdapter:
        if self.storage is None:
            raise RuntimeError(
                "No storage adapter configured. "
                "Pass a `storage` argument to the Minions constructor."
            )
        return self.storage

    async def save(self, minion: Minion) -> None:
        """
        Persist a minion to the configured storage adapter.
        Raises if no storage adapter has been configured.
        """
        await self._require_storage().set(minion)

    async def load(self, id: str) -> Optional[Minion]:
        """
        Load a minion from the configured storage adapter by ID.
        Returns ``None`` if the minion does not exist.
        Raises if no storage adapter has been configured.
        """
        return await self._require_storage().get(id)

    async def remove(self, minion: Minion) -> None:
        """
        Remove a minion from the configured storage adapter.
        Also removes all of its relations from the in-memory graph.
        Raises if no storage adapter has been configured.
        """
        hard_delete(minion, self.graph)
        await self._require_storage().delete(minion.id)

    async def list_minions(self, filter: Optional[StorageFilter] = None) -> List[Minion]:
        """
        List persisted minions from the configured storage adapter.
        Raises if no storage adapter has been configured.
        """
        return await self._require_storage().list(filter)

    async def search_minions(self, query: str) -> List[Minion]:
        """
        Full-text search across persisted minions.
        Raises if no storage adapter has been configured.
        """
        return await self._require_storage().search(query)
