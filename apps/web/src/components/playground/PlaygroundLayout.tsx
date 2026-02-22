
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
import { ArrowLeft, RotateCcw, Circle, Search, Plus, Share2, Download } from 'lucide-react';
import { useState } from 'react';

export default function PlaygroundLayout() {
    const { reset } = usePlayground();
    const [searchQuery, setSearchQuery] = useState('');

    const inspectorTabs = [
        {
            id: 'validation', label: 'Properties', content: (
                <div className="flex-1 overflow-y-auto">
                    <ValidationPanel />
                    <div className="p-4 border-t border-border">
                        <TypeSelector />
                    </div>
                </div>
            )
        },
        { id: 'relations', label: 'Relations', content: <RelationBuilder /> },
        { id: 'json', label: 'Output', content: <OutputPanel /> },
    ];

    return (
        <div className="flex flex-col h-screen bg-background text-primary overflow-hidden">
            {/* Top Bar */}
            <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-[#161616] shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <Link to="/" className="inline-flex items-center gap-1.5 text-muted hover:text-primary transition-colors text-sm group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    </Link>
                    <span className="font-bold text-lg tracking-tight">Minions Playground</span>
                    <div className="w-px h-5 bg-border" />
                    <div className="flex items-center gap-2 text-sm text-muted">
                        <span className="hover:text-primary cursor-pointer transition-colors">Playground</span>
                        <span className="text-xs">›</span>
                        <span className="text-primary font-medium">New Agent</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border text-sm text-muted hover:text-primary transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        Export
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-bold transition-colors shadow-lg shadow-accent/20">
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                    </button>
                    <Button size="sm" variant="ghost" onClick={reset}>
                        <span className="inline-flex items-center gap-1.5">
                            <RotateCcw className="w-3.5 h-3.5" />
                        </span>
                    </Button>
                </div>
            </header>

            {/* Main 3-Panel Layout */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left Sidebar: Minion List */}
                <aside className="w-72 flex flex-col border-r border-border bg-[#161616] shrink-0">
                    {/* Search */}
                    <div className="p-3 border-b border-border">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-accent transition-colors" />
                            <input
                                type="text"
                                placeholder="Search Minions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full py-2 pl-9 pr-3 text-sm border border-border rounded-lg bg-surface text-primary placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-3">
                        <MinionList />
                    </div>

                    {/* Footer: Add New */}
                    <div className="p-3 border-t border-border">
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-bold transition-colors shadow-lg shadow-accent/20">
                            <Plus className="w-4 h-4" />
                            Add New Minion
                        </button>
                    </div>
                </aside>

                {/* Center Panel: Editor + Visual Tree */}
                <main className="flex-1 flex flex-col min-w-0">
                    {/* Top: Code Editor */}
                    <div className="flex-1 flex flex-col min-h-[300px] border-b border-border relative">
                        {/* Editor Toolbar */}
                        <div className="h-9 flex items-center justify-between px-4 bg-[#1a1a1a] border-b border-border">
                            <span className="text-xs font-mono font-medium text-muted uppercase tracking-wider flex items-center gap-2">
                                <span className="text-accent">{'<>'}</span> agent_schema.json
                            </span>
                        </div>
                        {/* Editor Content */}
                        <div className="flex-1 overflow-auto p-4 bg-[#0d0d0d]">
                            <MinionEditor />
                        </div>
                    </div>

                    {/* Bottom: Visual Relation Builder / Tree */}
                    <div className="h-[45%] bg-[#0a0a0a] relative overflow-hidden flex flex-col">
                        {/* Toolbar */}
                        <div className="h-9 flex items-center px-4 border-b border-border bg-[#1a1a1a]">
                            <span className="text-xs font-mono font-medium text-muted uppercase tracking-wider">
                                Visual Tree
                            </span>
                        </div>
                        {/* Dot Grid Background */}
                        <div className="absolute inset-0 top-9 opacity-20 pointer-events-none" style={{
                            backgroundImage: 'radial-gradient(#444 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }} />
                        {/* Tree Content */}
                        <div className="flex-1 overflow-auto relative z-10">
                            <TreeViewer />
                        </div>
                    </div>
                </main>

                {/* Right Sidebar: Inspector */}
                <aside className="w-80 flex flex-col border-l border-border bg-[#161616] shrink-0">
                    <TabGroup tabs={inspectorTabs} />
                </aside>

            </div>
        </div>
    );
}
