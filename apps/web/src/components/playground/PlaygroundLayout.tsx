
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
import MinionList from './MinionList';
import { ArrowLeft, RotateCcw, Circle } from 'lucide-react';

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
            <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-surface/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/" className="inline-flex items-center gap-1.5 text-muted hover:text-primary transition-colors text-sm group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Home
                    </Link>
                    <div className="w-px h-5 bg-border" />
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">Playground</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs">
                            <Circle className="w-1.5 h-1.5 fill-current" />
                            Live
                        </span>
                    </div>
                </div>
                <Button size="sm" variant="ghost" onClick={reset}>
                    <span className="inline-flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                    </span>
                </Button>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

                {/* Left Panel: Editor + Minion List */}
                <div className="flex-1 flex flex-col border-r border-border overflow-y-auto min-w-[300px]">
                    {/* Panel Header */}
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface/50">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                        </div>
                        <span className="text-xs text-muted ml-1 font-mono">editor</span>
                    </div>
                    <div className="p-4 space-y-4 flex-1">
                        <TypeSelector />
                        <div className="flex-1 min-h-[400px]">
                            <MinionEditor />
                        </div>
                        <MinionList />
                    </div>
                </div>

                {/* Right Panel: Tools */}
                <div className="flex-1 flex flex-col overflow-y-auto">
                    {/* Panel Header */}
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface/50">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                        </div>
                        <span className="text-xs text-muted ml-1 font-mono">inspector</span>
                    </div>
                    <div className="p-4 bg-surface/30 flex-1">
                        <TabGroup tabs={rightPanelTabs} />
                    </div>
                </div>

            </div>
        </div>
    );
}
