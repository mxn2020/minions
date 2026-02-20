import { Link } from 'react-router-dom';

export default function Footer() {
    const getDocsUrl = () => {
        if (typeof window === 'undefined') return 'https://www.minions.help';
        return window.location.hostname.startsWith('dev--') ? 'https://www.minions.help' : 'https://www.minions.help';
    };

    const getBlogUrl = () => {
        if (typeof window === 'undefined') return 'https://www.minions.blog';
        return window.location.hostname.startsWith('dev--') ? 'https://www.minions.blog' : 'https://www.minions.blog';
    };
    return (
        <footer className="border-t border-border bg-background py-12">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="font-mono text-xl font-bold text-primary">⚡ minions</span>
                        </div>
                        <p className="mt-4 text-sm text-muted max-w-xs">
                            A universal structured object system for AI agents. Typed, validated, nestable.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-primary mb-4">Project</h3>
                        <ul className="space-y-2 text-sm text-muted">
                            <li><a href={getDocsUrl()} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Documentation</a></li>
                            <li><a href={getBlogUrl()} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Blog</a></li>
                            <li><a href="https://github.com/mxn2020/minions/blob/main/spec/v0.1.md" className="hover:text-primary transition-colors">Specification</a></li>
                            <li><a href="https://github.com/mxn2020/minions" className="hover:text-primary transition-colors">GitHub</a></li>
                            <li><a href="https://www.npmjs.com/package/minions-sdk" className="hover:text-primary transition-colors">NPM</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-primary mb-4">Legal</h3>
                        <ul className="space-y-2 text-sm text-muted">
                            <li><a href="https://github.com/mxn2020/minions/blob/main/LICENSE" className="hover:text-primary transition-colors">License (MIT)</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center bg-background gap-2">
                    <p className="text-xs text-muted">
                        © {new Date().getFullYear()} Minions Contributors. All rights reserved.
                    </p>
                    <p className="text-xs text-muted">
                        Created by <a href="https://the-mehdi.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">Mehdi Nabhani</a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
