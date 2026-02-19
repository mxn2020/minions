
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { usePlayground } from '../../hooks/usePlayground';
import { Button } from '../shared/Button';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function MinionEditor() {
    const { state, setEditorValue, createMinion, registry } = usePlayground();
    const isValid = state.validationResult?.valid;
    const hasResult = state.validationResult !== null;
    const selectedType = registry.getBySlug(state.selectedTypeSlug);

    return (
        <div className="flex flex-col h-full border border-border rounded-lg bg-surface relative overflow-hidden">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-white/5">
                <span className="text-xs font-mono text-muted uppercase tracking-wider">Editor</span>
                <div className="flex items-center space-x-2">
                    {hasResult && (
                        <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${isValid ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                            {isValid ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            <span>{isValid ? "Valid" : "Invalid"}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Validation Type Indicator */}
            {selectedType && (
                <div className="flex items-center px-4 py-1.5 text-xs text-muted border-b border-border bg-white/[0.02]">
                    <span>Validating as:&nbsp;</span>
                    <span className="font-medium text-primary">
                        {selectedType.icon && <span className="mr-1">{selectedType.icon}</span>}
                        {selectedType.name}
                    </span>
                </div>
            )}

            {/* CodeMirror */}
            <div className="flex-1 relative overflow-auto">
                <CodeMirror
                    value={state.editorValue}
                    height="100%"
                    extensions={[json()]}
                    onChange={(value) => setEditorValue(value)}
                    theme="dark"
                    className="text-sm font-mono h-full [&_.cm-editor]:h-full [&_.cm-scroller]:h-full"
                />
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-border bg-surface">
                <Button
                    className="w-full"
                    disabled={!isValid}
                    onClick={createMinion}
                >
                    Create Minion
                </Button>
            </div>
        </div>
    );
}
