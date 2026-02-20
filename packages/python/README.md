# minions-sdk (Python)

> Python SDK for the [Minions](https://github.com/mxn2020/minions) structured object system — queryable, nestable, evolvable, and AI-readable.

## Install

```bash
pip install minions-sdk
```

## Quick Start

```python
from minions import TypeRegistry, create_minion, RelationGraph

# 1. Get the built-in agent type
registry = TypeRegistry()
agent_type = registry.get_by_slug("agent")

# 2. Create an agent
minion, validation = create_minion(
    {"title": "Research Assistant", "fields": {"role": "researcher", "model": "gpt-4"}},
    agent_type,
)

# 3. Link minions together
graph = RelationGraph()
graph.add({"source_id": minion.id, "target_id": "skill-001", "type": "parent_of"})
```

## Cross-SDK Interop

Minions created in Python can be serialized to JSON and read by the TypeScript SDK:

```python
import json
data = minion.to_dict()          # camelCase keys
json_str = json.dumps(data)      # → valid JSON, TS-compatible
```

## Documentation

- 📘 [Docs](https://minions.help)
- 📄 [Specification v0.1](https://github.com/mxn2020/minions/blob/main/spec/v0.1.md)

## License

[MIT](../../LICENSE)

