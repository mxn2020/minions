
import { Link } from 'react-router-dom';
import { Button } from '../shared/Button';
import { usePlayground } from '../../hooks/usePlayground';
import TypeSelector from './TypeSelector';
import MinionEditor from './MinionEditor';
import ValidationPanel from './ValidationPanel';
import RelationBuilder from './RelationBuilder';
import TreeViewer from './TreeViewer';
import OutputPanel from './OutputPanel';
import { TabGroup } from '../shared/TabGroup';

export default function PlaygroundLayout() {
    const { reset } = usePlayground();

    const rightPanelTabs = [
        { id: 'validation', label: 'Validation', content: <ValidationPanel /> },
        { id: 'relations', label: 'Relations', content: <RelationBuilder /> },
        { id: 'tree', label: 'Visual Tree', content: <TreeViewer /> },
        { id: 'json', label: 'Full JSON', content: <OutputPanel /> },
    ];

    return (
        <div className="flex flex-col h-screen bg-background text-primary overflow-hidden">
            {/* Top Bar */}
            <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-surface/50">
                <div className="flex items-center space-x-4">
                    <Link to="/" className="text-muted hover:text-primary transition-colors text-sm">
                        ← Back
                    </Link>
                    <span className="font-mono font-bold">Playground</span>
                </div>
                <Button size="sm" variant="ghost" onClick={reset}>Reset</Button>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

                {/* Left Panel: Editor */}
                <div className="flex-1 flex flex-col p-4 border-r border-border overflow-y-auto min-w-[300px]">
                    <TypeSelector />
                    <div className="flex-1 min-h-[400px]">
                        <MinionEditor />
                    </div>
                </div>

                {/* Right Panel: Tools */}
                <div className="flex-1 flex flex-col p-4 bg-surface/30 overflow-y-auto">
                    <TabGroup tabs={rightPanelTabs} />
                </div>

            </div>
        </div>
    );
}
