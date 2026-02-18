import { describe, it, expect } from 'vitest';
import { RelationGraph } from '../relations/index.js';

describe('RelationGraph', () => {
  it('should add and retrieve relations', () => {
    const graph = new RelationGraph();
    const rel = graph.add({ sourceId: 'a', targetId: 'b', type: 'parent_of' });

    expect(rel.id).toBeDefined();
    expect(graph.get(rel.id)).toBeDefined();
    expect(graph.list()).toHaveLength(1);
  });

  it('should remove relations', () => {
    const graph = new RelationGraph();
    const rel = graph.add({ sourceId: 'a', targetId: 'b', type: 'parent_of' });

    expect(graph.remove(rel.id)).toBe(true);
    expect(graph.list()).toHaveLength(0);
  });

  it('should remove all relations by minion id', () => {
    const graph = new RelationGraph();
    graph.add({ sourceId: 'a', targetId: 'b', type: 'parent_of' });
    graph.add({ sourceId: 'c', targetId: 'a', type: 'depends_on' });
    graph.add({ sourceId: 'b', targetId: 'c', type: 'relates_to' });

    const removed = graph.removeByMinionId('a');
    expect(removed).toBe(2);
    expect(graph.list()).toHaveLength(1);
  });

  it('should get children', () => {
    const graph = new RelationGraph();
    graph.add({ sourceId: 'parent', targetId: 'child1', type: 'parent_of' });
    graph.add({ sourceId: 'parent', targetId: 'child2', type: 'parent_of' });
    graph.add({ sourceId: 'parent', targetId: 'ref', type: 'references' });

    const children = graph.getChildren('parent');
    expect(children).toHaveLength(2);
    expect(children).toContain('child1');
    expect(children).toContain('child2');
  });

  it('should get parents', () => {
    const graph = new RelationGraph();
    graph.add({ sourceId: 'parent1', targetId: 'child', type: 'parent_of' });
    graph.add({ sourceId: 'parent2', targetId: 'child', type: 'parent_of' });

    const parents = graph.getParents('child');
    expect(parents).toHaveLength(2);
  });

  it('should get tree of descendants', () => {
    const graph = new RelationGraph();
    graph.add({ sourceId: 'root', targetId: 'a', type: 'parent_of' });
    graph.add({ sourceId: 'root', targetId: 'b', type: 'parent_of' });
    graph.add({ sourceId: 'a', targetId: 'a1', type: 'parent_of' });

    const tree = graph.getTree('root');
    expect(tree).toHaveLength(3);
    expect(tree).toContain('a');
    expect(tree).toContain('b');
    expect(tree).toContain('a1');
  });

  it('should get network', () => {
    const graph = new RelationGraph();
    graph.add({ sourceId: 'a', targetId: 'b', type: 'parent_of' });
    graph.add({ sourceId: 'c', targetId: 'a', type: 'depends_on' });

    const network = graph.getNetwork('a');
    expect(network).toHaveLength(2);
    expect(network).toContain('b');
    expect(network).toContain('c');
  });

  it('should filter by relation type', () => {
    const graph = new RelationGraph();
    graph.add({ sourceId: 'a', targetId: 'b', type: 'parent_of' });
    graph.add({ sourceId: 'a', targetId: 'c', type: 'depends_on' });

    expect(graph.getFromSource('a', 'parent_of')).toHaveLength(1);
    expect(graph.getFromSource('a')).toHaveLength(2);
  });
});
