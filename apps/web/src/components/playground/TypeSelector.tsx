
import { usePlayground } from '../../hooks/usePlayground';

export default function TypeSelector() {
    const { state, setType, registry } = usePlayground();
    const types = registry.list();

    return (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {types.map((type) => (
                <button
                    key={type.slug}
                    onClick={() => setType(type.slug)}
                    className={`
            flex items-center space-x-2 px-3 py-1.5 rounded-full border text-sm whitespace-nowrap transition-colors
            ${state.selectedTypeSlug === type.slug
                            ? 'bg-accent border-accent text-white'
                            : 'bg-surface border-border text-muted hover:border-primary/50 hover:text-primary'}
          `}
                >
                    <span>{type.icon || '📦'}</span>
                    <span>{type.name}</span>
                </button>
            ))}
        </div>
    );
}
