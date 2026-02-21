import pytest
from typing import Any
from minions import Minions, MinionPlugin
from minions.client.middleware import MinionMiddleware, MinionContext


# ─── Existing client tests (now async) ────────────────────────────────────────

@pytest.mark.asyncio
async def test_client_initializes_and_creates_minion():
    minions = Minions()
    wrapper = await minions.create("agent", {
        "title": "Test Agent",
        "fields": {"role": "tester", "model": "gpt-4"}
    })
    
    assert wrapper.data.id is not None
    assert wrapper.data.title == "Test Agent"
    assert wrapper.data.minion_type_id == "builtin-agent"
    assert wrapper.data.fields["role"] == "tester"

@pytest.mark.asyncio
async def test_client_links_minions():
    minions = Minions()
    agent = await minions.create("agent", {"title": "Agent", "fields": {"role": "tester"}})
    skill = await minions.create("note", {"title": "Note", "fields": {"content": "hello"}})
    
    agent.link_to(skill.data.id, "parent_of")
    
    children = minions.graph.get_children(agent.data.id)
    assert len(children) == 1
    assert children[0] == skill.data.id

class MockPlugin(MinionPlugin):
    @property
    def namespace(self) -> str:
        return "mock"
        
    def init(self, core: Minions) -> Any:
        class PluginAPI:
            def __init__(self, core_ref):
                self.client = core_ref
            def say_hello(self):
                return "hello"
        return PluginAPI(core)

def test_client_supports_plugins():
    minions = Minions(plugins=[MockPlugin()])
    assert hasattr(minions, "mock")
    assert minions.mock.say_hello() == "hello"
    assert minions.mock.client == minions


# ─── Middleware Tests ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_middleware_execution_order():
    order = []

    async def mw1(ctx, next_fn):
        order.append("mw1-before")
        await next_fn()
        order.append("mw1-after")

    async def mw2(ctx, next_fn):
        order.append("mw2-before")
        await next_fn()
        order.append("mw2-after")

    minions = Minions(middleware=[mw1, mw2])
    await minions.create("note", {"title": "Test", "fields": {"content": "hello"}})

    assert order == ["mw1-before", "mw2-before", "mw2-after", "mw1-after"]


@pytest.mark.asyncio
async def test_middleware_context_population():
    captured = {}

    async def spy(ctx, next_fn):
        captured["operation"] = ctx.operation
        captured["args"] = dict(ctx.args)
        await next_fn()

    minions = Minions(middleware=[spy])
    await minions.create("note", {"title": "Spy Test", "fields": {"content": "data"}})

    assert captured["operation"] == "create"
    assert captured["args"]["type_slug"] == "note"
    assert captured["args"]["input_data"]["title"] == "Spy Test"


@pytest.mark.asyncio
async def test_middleware_result_after_core():
    result_after = [None]

    async def spy(ctx, next_fn):
        assert ctx.result is None
        await next_fn()
        result_after[0] = ctx.result

    minions = Minions(middleware=[spy])
    wrapper = await minions.create("note", {"title": "Result Test", "fields": {"content": "x"}})

    assert result_after[0] is not None
    assert result_after[0].id == wrapper.data.id


@pytest.mark.asyncio
async def test_middleware_short_circuit():
    from minions.types import Minion
    from minions.lifecycle import now

    async def blocker(ctx, next_fn):
        # Do NOT call next_fn() — short-circuit
        ctx.result = Minion(
            id="mock-id",
            title="Blocked",
            minion_type_id="builtin-note",
            fields={},
            created_at=now(),
            updated_at=now(),
        )

    minions = Minions(middleware=[blocker])
    wrapper = await minions.create("note", {"title": "Original", "fields": {"content": "x"}})

    assert wrapper.data.title == "Blocked"
    assert wrapper.data.id == "mock-id"


@pytest.mark.asyncio
async def test_middleware_error_propagation():
    async def failing(ctx, next_fn):
        raise RuntimeError("Auth denied")

    minions = Minions(middleware=[failing])
    with pytest.raises(RuntimeError, match="Auth denied"):
        await minions.create("note", {"title": "X", "fields": {"content": "y"}})


@pytest.mark.asyncio
async def test_middleware_cross_middleware_metadata():
    async def setter(ctx, next_fn):
        ctx.metadata["user_id"] = "user-123"
        await next_fn()

    async def reader(ctx, next_fn):
        assert ctx.metadata["user_id"] == "user-123"
        await next_fn()

    minions = Minions(middleware=[setter, reader])
    await minions.create("note", {"title": "Meta", "fields": {"content": "test"}})


@pytest.mark.asyncio
async def test_middleware_storage_operations():
    from minions.storage import MemoryStorageAdapter

    log = []

    async def logger(ctx, next_fn):
        log.append(f"before:{ctx.operation}")
        await next_fn()
        log.append(f"after:{ctx.operation}")

    storage = MemoryStorageAdapter()
    minions = Minions(middleware=[logger], storage=storage)

    wrapper = await minions.create("note", {"title": "Logged", "fields": {"content": "a"}})
    await minions.save(wrapper.data)
    await minions.load(wrapper.data.id)
    await minions.list_minions()
    await minions.search_minions("logged")

    assert log == [
        "before:create", "after:create",
        "before:save", "after:save",
        "before:load", "after:load",
        "before:list", "after:list",
        "before:search", "after:search",
    ]


@pytest.mark.asyncio
async def test_no_middleware_passthrough():
    minions = Minions()
    wrapper = await minions.create("note", {"title": "No MW", "fields": {"content": "plain"}})
    assert wrapper.data.title == "No MW"
