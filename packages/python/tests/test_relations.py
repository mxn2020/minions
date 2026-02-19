"""
Tests for the Minions Python RelationGraph.
Mirrors: packages/core/src/__tests__/relations.test.ts
"""

from minions import RelationGraph


class TestRelationGraph:
    def test_add_and_retrieve_relations(self):
        graph = RelationGraph()
        rel = graph.add({"source_id": "a", "target_id": "b", "type": "parent_of"})
        assert rel.id is not None
        assert graph.get(rel.id) is not None
        assert len(graph.list()) == 1

    def test_remove_relations(self):
        graph = RelationGraph()
        rel = graph.add({"source_id": "a", "target_id": "b", "type": "parent_of"})
        assert graph.remove(rel.id) is True
        assert len(graph.list()) == 0

    def test_remove_all_relations_by_minion_id(self):
        graph = RelationGraph()
        graph.add({"source_id": "a", "target_id": "b", "type": "parent_of"})
        graph.add({"source_id": "c", "target_id": "a", "type": "depends_on"})
        graph.add({"source_id": "b", "target_id": "c", "type": "relates_to"})

        removed = graph.remove_by_minion_id("a")
        assert removed == 2
        assert len(graph.list()) == 1

    def test_get_children(self):
        graph = RelationGraph()
        graph.add({"source_id": "parent", "target_id": "child1", "type": "parent_of"})
        graph.add({"source_id": "parent", "target_id": "child2", "type": "parent_of"})
        graph.add({"source_id": "parent", "target_id": "ref", "type": "references"})

        children = graph.get_children("parent")
        assert len(children) == 2
        assert "child1" in children
        assert "child2" in children

    def test_get_parents(self):
        graph = RelationGraph()
        graph.add({"source_id": "parent1", "target_id": "child", "type": "parent_of"})
        graph.add({"source_id": "parent2", "target_id": "child", "type": "parent_of"})

        parents = graph.get_parents("child")
        assert len(parents) == 2

    def test_get_tree_of_descendants(self):
        graph = RelationGraph()
        graph.add({"source_id": "root", "target_id": "a", "type": "parent_of"})
        graph.add({"source_id": "root", "target_id": "b", "type": "parent_of"})
        graph.add({"source_id": "a", "target_id": "a1", "type": "parent_of"})

        tree = graph.get_tree("root")
        assert len(tree) == 3
        assert "a" in tree
        assert "b" in tree
        assert "a1" in tree

    def test_get_network(self):
        graph = RelationGraph()
        graph.add({"source_id": "a", "target_id": "b", "type": "parent_of"})
        graph.add({"source_id": "c", "target_id": "a", "type": "depends_on"})

        network = graph.get_network("a")
        assert len(network) == 2
        assert "b" in network
        assert "c" in network

    def test_filter_by_relation_type(self):
        graph = RelationGraph()
        graph.add({"source_id": "a", "target_id": "b", "type": "parent_of"})
        graph.add({"source_id": "a", "target_id": "c", "type": "depends_on"})

        assert len(graph.get_from_source("a", "parent_of")) == 1
        assert len(graph.get_from_source("a")) == 2

    def test_handles_circular_parent_of(self):
        graph = RelationGraph()
        graph.add({"source_id": "a", "target_id": "b", "type": "parent_of"})
        graph.add({"source_id": "b", "target_id": "c", "type": "parent_of"})
        graph.add({"source_id": "c", "target_id": "a", "type": "parent_of"})  # cycle

        tree = graph.get_tree("a")
        assert len(tree) == 3
        assert "b" in tree
        assert "c" in tree
        assert "a" in tree
