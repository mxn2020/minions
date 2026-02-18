
import { TabGroup } from '../shared/TabGroup';
import { CodeBlock } from '../shared/CodeBlock';
import { Copy } from 'lucide-react';
import { useClipboard } from '../../hooks/useClipboard';

function CommandRow({ cmd, desc }: { cmd: string, desc: string }) {
    const { copy, copied } = useClipboard();

    return (
        <div className="flex flex-col space-y-2 mb-6 last:mb-0">
            <div className="flex items-center space-x-2 bg-black border border-border rounded-md p-3 group relative">
                <code className="text-sm font-mono text-green-400 flex-1">{cmd}</code>
                <button
                    onClick={() => copy(cmd)}
                    className="text-muted hover:text-white transition-colors"
                >
                    {copied ? <span className="text-green-500 text-xs">Copied</span> : <Copy className="w-4 h-4" />}
                </button>
            </div>
            <p className="text-xs text-muted pl-1">{desc}</p>
        </div>
    );
}

export default function QuickStart() {
    const tabs = [
        {
            id: 'library',
            label: 'Library',
            content: (
                <div className="pt-6">
                    <CommandRow cmd="npm install @minions/core" desc="Install the core library" />
                    <div className="mt-6">
                        <CodeBlock
                            language="typescript"
                            code={`import { TypeRegistry, createMinion, validateFields } from '@minions/core';

// 1. Get the built-in agent type
const registry = new TypeRegistry();
const agentType = registry.getBySlug('agent')!;

// 2. Create an agent
const { minion, validation } = createMinion({
  title: 'My First Agent',
  minionTypeId: agentType.id,
  fields: {
    role: 'assistant',
    model: 'gpt-4'
  }
}, agentType);

console.log(validation.valid); // true
console.log(minion.id);        // UUID`}
                        />
                    </div>
                </div>
            )
        },
        {
            id: 'cli',
            label: 'CLI',
            content: (
                <div className="pt-6">
                    <CommandRow cmd="npx @minions/cli init" desc="Scaffold a new minions project with config file" />
                    <CommandRow cmd="npx @minions/cli type list" desc="List all available minion types" />
                    <CommandRow cmd="npx @minions/cli validate my-agent.json" desc="Validate a local minion file against schema" />
                </div>
            )
        }
    ];

    return (
        <section className="py-24 bg-background border-t border-border">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl font-bold tracking-tight mb-16 text-center">
                    Up in 30 seconds.
                </h2>

                <div className="max-w-2xl mx-auto bg-surface border border-border rounded-xl p-8">
                    <TabGroup tabs={tabs} />
                </div>
            </div>
        </section>
    );
}
