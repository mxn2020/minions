
import { useState } from 'react';
import { usePlayground } from '../../hooks/usePlayground';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { ArrowRight, Trash2, Plus } from 'lucide-react';
import { RelationType } from 'minions-core';

const relationTypes: RelationType[] = [
    'parent_of', 'depends_on', 'implements', 'relates_to',
    'inspired_by', 'triggers', 'references', 'blocks',
    'alternative_to', 'part_of', 'follows', 'integration_link'
];

export default function RelationBuilder() {
    const { state, addRelation, removeRelation } = usePlayground();
    const [sourceId, setSourceId] = useState('');
    const [targetId, setTargetId] = useState('');
    const [type, setType] = useState<RelationType>('parent_of');

    const canAdd = sourceId && targetId && sourceId !== targetId;

    const handleAdd = () => {
        if (canAdd) {
            addRelation(sourceId, targetId, type);
            setSourceId('');
            setTargetId('');
        }
    };

    if (state.minions.length < 2) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted">
                <p>Create at least two minions to add relations.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Add Form */}
            <div className="p-4 border-b border-border bg-surface/50 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Add Relation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-muted mb-1">Source</label>
                        <select
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                            value={sourceId}
                            onChange={(e) => setSourceId(e.target.value)}
                        >
                            <option value="">Select Minion</option>
                            {state.minions.map(m => (
                                <option key={m.id} value={m.id}>{m.title}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-muted mb-1">Type</label>
                        <select
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                            value={type}
                            onChange={(e) => setType(e.target.value as RelationType)}
                        >
                            {relationTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-muted mb-1">Target</label>
                        <select
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                        >
                            <option value="">Select Minion</option>
                            {state.minions.map(m => (
                                <option key={m.id} value={m.id}>{m.title}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <Button
                    className="w-full"
                    disabled={!canAdd}
                    onClick={handleAdd}
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Relation
                </Button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {state.relations.length === 0 && (
                    <p className="text-center text-muted text-sm py-8">No relations yet.</p>
                )}
                {state.relations.map(rel => {
                    const source = state.minions.find(m => m.id === rel.sourceId);
                    const target = state.minions.find(m => m.id === rel.targetId);
                    if (!source || !target) return null;

                    return (
                        <div key={rel.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface">
                            <div className="flex items-center space-x-3 text-sm">
                                <span className="font-medium">{source.title}</span>
                                <Badge variant="default">{rel.type}</Badge>
                                <ArrowRight className="w-4 h-4 text-muted" />
                                <span className="font-medium">{target.title}</span>
                            </div>
                            <button
                                onClick={() => removeRelation(rel.id)}
                                className="text-muted hover:text-error transition-colors p-1"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
