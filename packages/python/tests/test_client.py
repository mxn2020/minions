import pytest
from typing import Any
from minions import Minions, MinionPlugin

def test_client_initializes_and_creates_minion():
    minions = Minions()
    wrapper = minions.create("agent", {
        "title": "Test Agent",
        "fields": {"role": "tester", "model": "gpt-4"}
    })
    
    assert wrapper.data.id is not None
    assert wrapper.data.title == "Test Agent"
    assert wrapper.data.minion_type_id == "builtin-agent"
    assert wrapper.data.fields["role"] == "tester"

def test_client_links_minions():
    minions = Minions()
    agent = minions.create("agent", {"title": "Agent", "fields": {"role": "tester"}})
    skill = minions.create("note", {"title": "Note", "fields": {"content": "hello"}})
    
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
