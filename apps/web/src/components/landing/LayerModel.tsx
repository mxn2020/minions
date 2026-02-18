
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Network, Brain, MessageSquare, FlaskConical, Zap } from 'lucide-react';
import { CodeBlock } from '../shared/CodeBlock';
import { flatAgentExample, teamExample, thoughtExample, promptExample, testExample, taskExample } from '../../lib/examples';

export default function LayerModel() {
    const [activeLayer, setActiveLayer] = useState(0);

    const layers = [
        {
            icon: Fingerprint,
            title: "Definition",
            desc: "What a thing is",
            detail: "Agent, Skill, Tool, Personality",
            code: flatAgentExample
        },
        {
            icon: Network,
            title: "Organization",
            desc: "How things group",
            detail: "Team, Collection, Folder",
            code: teamExample
        },
        {
            icon: Brain,
            title: "Memory",
            desc: "What a thing knows",
            detail: "Thought, Memory, Decision",
            code: thoughtExample
        },
        {
            icon: MessageSquare,
            title: "Interface",
            desc: "How a thing presents itself",
            detail: "Prompt Template, Persona",
            code: promptExample
        },
        {
            icon: FlaskConical,
            title: "Evaluation",
            desc: "How a thing is measured",
            detail: "Test Case, Benchmark, Score",
            code: testExample
        },
        {
            icon: Zap,
            title: "Execution",
            desc: "What a thing does",
            detail: "Task, Workflow, Trigger",
            code: taskExample
        }
    ];

    return (
        <section className="py-24 bg-background border-t border-border">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">
                        Six layers. Use what you need.
                    </h2>
                    <p className="text-muted text-lg max-w-2xl mx-auto">
                        Each layer is just a standard MinionType. Ignore the layers you don't need. Add your own.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                    {/* Left Column: List */}
                    <div className="lg:col-span-4 flex flex-col space-y-2">
                        {layers.map((layer, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveLayer(i)}
                                className={`
                  flex items-center p-4 rounded-xl text-left transition-all duration-300
                  ${activeLayer === i
                                        ? 'bg-surface border border-accent/50 shadow-[0_0_20px_-10px_rgba(124,58,237,0.5)]'
                                        : 'bg-transparent border border-transparent hover:bg-white/5'}
                `}
                            >
                                <div className={`p-2 rounded-lg mr-4 ${activeLayer === i ? 'bg-accent text-white' : 'bg-surface text-muted'}`}>
                                    <layer.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className={`font-semibold ${activeLayer === i ? 'text-primary' : 'text-muted'}`}>{layer.title}</h3>
                                    <p className="text-xs text-muted">{layer.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Right Column: Detail */}
                    <div className="lg:col-span-8 min-h-[500px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeLayer}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="bg-surface border border-border rounded-xl overflow-hidden p-6"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <h3 className="text-xl font-bold">{layers[activeLayer].title} Layer</h3>
                                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-mono text-muted">
                                            {layers[activeLayer].detail}
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-lg overflow-hidden border border-border">
                                    <CodeBlock code={layers[activeLayer].code} className="border-0" />
                                </div>

                                {activeLayer === 5 && (
                                    <p className="mt-4 text-xs text-muted font-mono bg-white/5 p-3 rounded-md">
                                        Note: Execution layer interface is defined in v0.1 spec, runtime implementation TBD.
                                    </p>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </section>
    );
}
