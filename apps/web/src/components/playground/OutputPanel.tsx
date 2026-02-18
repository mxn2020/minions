
import { CodeBlock } from '../shared/CodeBlock';
import { usePlayground } from '../../hooks/usePlayground';

export default function OutputPanel() {
    const { state } = usePlayground();

    const output = {
        minions: state.minions,
        relations: state.relations
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden rounded-lg border border-border">
                <CodeBlock
                    code={JSON.stringify(output, null, 2)}
                    className="h-full border-0 rounded-none [&_.cm-editor]:h-full [&_.cm-scroller]:h-full"
                />
            </div>
        </div>
    );
}
