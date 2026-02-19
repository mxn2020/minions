
// import React from 'react'; // React is auto-imported in Vite

import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { javascript } from '@codemirror/lang-javascript';
import { Copy, Check } from 'lucide-react';
import { useClipboard } from '../../hooks/useClipboard';
import { useMemo } from 'react';

interface CodeBlockProps {
    code: string;
    language?: string;
    title?: string;
    className?: string;
}

export function CodeBlock({ code, language = 'json', title, className = '' }: CodeBlockProps) {
    const { copy, copied } = useClipboard();

    const extensions = useMemo(() => {
        switch (language) {
            case 'typescript':
            case 'javascript':
            case 'ts':
            case 'js':
                return [javascript({ typescript: language === 'typescript' || language === 'ts' })];
            case 'json':
            default:
                return [json()];
        }
    }, [language]);

    return (
        <div className={`relative overflow-hidden rounded-lg border border-border bg-surface ${className}`}>
            {(title) && (
                <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-white/5">
                    <span className="text-xs font-mono text-muted">{title}</span>
                </div>
            )}
            <div className="relative group">
                <button
                    onClick={() => copy(code)}
                    className="absolute right-2 top-2 z-10 p-1.5 rounded-md bg-transparent text-muted hover:text-primary hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Copy code"
                >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
                <CodeMirror
                    value={code}
                    extensions={extensions}
                    editable={false}
                    theme="dark"
                    basicSetup={{
                        lineNumbers: false,
                        foldGutter: false,
                        highlightActiveLine: false,
                    }}
                    className="text-sm font-mono text-left [&_.cm-editor]:bg-transparent [&_.cm-gutters]:bg-transparent"
                />
            </div>
        </div>
    );
}

