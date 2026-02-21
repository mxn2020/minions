from typing import Dict, List, Optional, Any
from ..types import Minion, MinionType, CreateMinionInput, UpdateMinionInput, RelationType
from ..registry import TypeRegistry
from ..relations import RelationGraph
from ..lifecycle import create_minion, update_minion, soft_delete, hard_delete, restore_minion
from ..storage.adapter import StorageAdapter, StorageFilter
from .plugin import MinionPlugin
from .middleware import MinionMiddleware, MinionContext, run_middleware

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
    Orchestrates TypeRegistry and RelationGraph directly, and supports
    plugin mounting and an optional middleware pipeline.

    Pass a ``storage`` adapter to enable minion persistence::

        storage = await JsonFileStorageAdapter.create("./data/minions")
        minions = Minions(storage=storage)
        wrapper = await minions.create("note", {"title": "Hello", "fields": {"content": "World"}})
        await minions.save(wrapper.data)

    Add middleware for cross-cutting concerns::

        async def logger(ctx, next_fn):
            print(f"{ctx.operation} started")
            await next_fn()
            print(f"{ctx.operation} completed")

        minions = Minions(middleware=[logger])
    """
    registry: TypeRegistry
    graph: RelationGraph

    def __init__(
        self,
        plugins: Optional[List[MinionPlugin]] = None,
        storage: Optional[StorageAdapter] = None,
        middleware: Optional[List[MinionMiddleware]] = None,
    ):
        self.registry = TypeRegistry()
        self.graph = RelationGraph()
        self.storage: Optional[StorageAdapter] = storage
        self._middleware: List[MinionMiddleware] = middleware or []

        if plugins:
            for plugin in plugins:
                setattr(self, plugin.namespace, plugin.init(self))

    # ── Middleware helper ──────────────────────────────────────────────────

    async def _run(
        self,
        operation: str,
        args: Dict[str, Any],
        core,
    ) -> MinionContext:
        """Run the middleware pipeline for an operation."""
        ctx = MinionContext(operation=operation, args=args)

        if not self._middleware:
            await core(ctx)
        else:
            await run_middleware(self._middleware, ctx, lambda: core(ctx))

        return ctx

    # ── Lifecycle ─────────────────────────────────────────────────────────
                
    async def create(self, type_slug: str, input_data: CreateMinionInput) -> MinionWrapper:
        """
        Creates a new minion and returns an enhanced MinionWrapper.
        Looks up the appropriate schema from the internal TypeRegistry using the slug.
        """
        async def core(ctx: MinionContext):
            minion_type = self.registry.get_by_slug(type_slug)
            if not minion_type:
                raise ValueError(f"MinionType with slug '{type_slug}' not found in registry.")
                
            minion, validation = create_minion(input_data, minion_type)
            if not validation.valid:
                errors = "\n".join([f"- {e.field}: {e.message}" for e in validation.errors])
                raise ValueError(f"Validation failed for '{type_slug}':\n{errors}")
                
            ctx.result = minion

        ctx = await self._run("create", {"type_slug": type_slug, "input_data": input_data}, core)
        return MinionWrapper(ctx.result, self)
        
    async def update(self, minion: Minion, input_data: UpdateMinionInput) -> MinionWrapper:
        """Updates an existing minion's data."""
        async def core(ctx: MinionContext):
            minion_type = self.registry.get_by_id(minion.minion_type_id)
            if not minion_type:
                raise ValueError(f"MinionType '{minion.minion_type_id}' not found in registry.")
                
            updated_minion, validation = update_minion(minion, input_data, minion_type)
            if not validation.valid:
                errors = "\n".join([f"- {e.field}: {e.message}" for e in validation.errors])
                raise ValueError(f"Validation failed for update:\n{errors}")
                
            ctx.result = updated_minion

        ctx = await self._run("update", {"minion": minion, "input_data": input_data}, core)
        return MinionWrapper(ctx.result, self)

    async def soft_delete(self, minion: Minion) -> MinionWrapper:
        """Soft deletes a minion."""
        async def core(ctx: MinionContext):
            ctx.result = soft_delete(minion)
        
        ctx = await self._run("soft_delete", {"minion": minion}, core)
        return MinionWrapper(ctx.result, self)
        
    async def hard_delete(self, minion: Minion) -> None:
        """
        Hard deletes a minion from the relation graph.
        Note: This does not remove it from your external storage.
        """
        async def core(ctx: MinionContext):
            hard_delete(minion, self.graph)

        await self._run("hard_delete", {"minion": minion}, core)
        
    async def restore(self, minion: Minion) -> MinionWrapper:
        """Restores a soft-deleted minion."""
        async def core(ctx: MinionContext):
            ctx.result = restore_minion(minion)

        ctx = await self._run("restore", {"minion": minion}, core)
        return MinionWrapper(ctx.result, self)

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
        async def core(ctx: MinionContext):
            await self._require_storage().set(minion)

        await self._run("save", {"minion": minion}, core)

    async def load(self, id: str) -> Optional[Minion]:
        """
        Load a minion from the configured storage adapter by ID.
        Returns ``None`` if the minion does not exist.
        Raises if no storage adapter has been configured.
        """
        async def core(ctx: MinionContext):
            ctx.result = await self._require_storage().get(id)

        ctx = await self._run("load", {"id": id}, core)
        return ctx.result

    async def remove(self, minion: Minion) -> None:
        """
        Remove a minion from the configured storage adapter.
        Also removes all of its relations from the in-memory graph.
        Raises if no storage adapter has been configured.
        """
        async def core(ctx: MinionContext):
            hard_delete(minion, self.graph)
            await self._require_storage().delete(minion.id)

        await self._run("remove", {"minion": minion}, core)

    async def list_minions(self, filter: Optional[StorageFilter] = None) -> List[Minion]:
        """
        List persisted minions from the configured storage adapter.
        Raises if no storage adapter has been configured.
        """
        async def core(ctx: MinionContext):
            ctx.result = await self._require_storage().list(filter)

        ctx = await self._run("list", {"filter": filter}, core)
        return ctx.result

    async def search_minions(self, query: str) -> List[Minion]:
        """
        Full-text search across persisted minions.
        Raises if no storage adapter has been configured.
        """
        async def core(ctx: MinionContext):
            ctx.result = await self._require_storage().search(query)

        ctx = await self._run("search", {"query": query}, core)
        return ctx.result
