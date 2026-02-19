
import { usePlayground } from '../../hooks/usePlayground';
import { Minion } from '@minions/core';

export default function TreeViewer() {
    const { state, registry } = usePlayground();

    // Simple tree builder: find roots (minions with no incoming parent_of relations)
    // then recursively render children

    const parentOfRelations = state.relations.filter(r => r.type === 'parent_of');
    const childIds = new Set(parentOfRelations.map(r => r.targetId));
    const roots = state.minions.filter(m => !childIds.has(m.id));

    // Fallback: if no parent_of relations but minions exist, show all as roots
    const effectiveRoots = roots.length > 0 ? roots : (parentOfRelations.length === 0 ? state.minions : []);

    const renderNode = (minion: Minion, depth: number = 0) => {
        const type = registry.getById(minion.minionTypeId);
        const childrenRels = parentOfRelations.filter(r => r.sourceId === minion.id);
        const children = childrenRels.map(r => state.minions.find(m => m.id === r.targetId)).filter(Boolean) as Minion[];

        return (
            <div key={minion.id} className="mb-1">
                <div
                    className="flex items-center p-2 rounded hover:bg-white/5 border border-transparent hover:border-border transition-colors"
                    style={{ marginLeft: `${depth * 24}px` }}
                >
                    <span className="mr-2 text-lg">{type?.icon || '📦'}</span>
                    <span className="font-medium text-sm mr-2">{minion.title}</span>
                    <span className="text-xs text-muted font-mono px-1.5 py-0.5 rounded bg-white/5">
                        {type?.name || 'Unknown'}
                    </span>
                </div>
                <div>
                    {children.map(child => renderNode(child, depth + 1))}
                </div>
            </div>
        );
    };

    if (state.minions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted">
                <p>Create minions to see the tree.</p>
            </div>
        );
    }

    return (
        <div className="p-4 h-full overflow-y-auto">
            {effectiveRoots.map(root => renderNode(root))}
        </div>
    );
}
