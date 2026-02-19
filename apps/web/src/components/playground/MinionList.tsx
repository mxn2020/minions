
import { usePlayground } from '../../hooks/usePlayground';
import { Trash2 } from 'lucide-react';

export default function MinionList() {
    const { state, removeMinion, registry } = usePlayground();

    if (state.minions.length === 0) {
        return (
            <div className="mt-4 p-4 text-center text-xs text-muted border border-dashed border-border rounded-lg">
                No minions created yet.
            </div>
        );
    }

    return (
        <div className="mt-4 space-y-2">
            <h3 className="text-xs font-mono text-muted uppercase tracking-wider mb-2">
                Created Minions ({state.minions.length})
            </h3>
            {state.minions.map(minion => {
                const type = registry.getById(minion.minionTypeId);
                return (
                    <div
                        key={minion.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg bg-surface hover:bg-white/5 transition-colors group"
                    >
                        <div className="flex items-center space-x-3 min-w-0">
                            <span className="text-lg flex-shrink-0">{type?.icon || '📦'}</span>
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{minion.title}</p>
                                <span className="text-[10px] text-muted font-mono px-1.5 py-0.5 rounded bg-white/5 inline-block mt-0.5">
                                    {type?.name || 'Unknown'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => removeMinion(minion.id)}
                            className="p-1.5 rounded text-muted hover:text-error hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete minion"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
