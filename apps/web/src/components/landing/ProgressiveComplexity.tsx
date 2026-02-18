
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CodeBlock } from '../shared/CodeBlock';
import { Button } from '../shared/Button';
import { flatAgentExample, nestedAgentExample, teamExample } from '../../lib/examples';

export default function ProgressiveComplexity() {
    const [activeStep, setActiveStep] = useState(0);
    const [hovering, setHovering] = useState(false);

    // Auto-advance
    useEffect(() => {
        if (hovering) return;
        const timer = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % 3);
        }, 5000);
        return () => clearInterval(timer);
    }, [hovering]);

    const steps = [
        {
            title: "Flat Agent",
            desc: "A single minion. The entire agent definition in one JSON object.",
            code: flatAgentExample,
            detail: null
        },
        {
            title: "Nested Agent",
            desc: "The same agent, now with skills, memory, and tests linked via relations.",
            code: nestedAgentExample,
            detail: (
                <pre className="font-mono text-xs text-muted leading-tight overflow-hidden">
                    {`Writer Agent (agent)
├── Blog Writing (skill)
├── SEO Optimization (skill)
├── Writing Style Guide (thought)
├── Draft Blog Post (prompt)
└── Quality Check (test-case)`}
                </pre>
            )
        },
        {
            title: "Agent Team",
            desc: "Multiple agents organized under a team with a sequential strategy.",
            code: teamExample,
            detail: null
        }
    ];

    return (
        <section
            className="py-24 bg-surface/30 border-t border-border"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">
                        Start simple. Grow without pain.
                    </h2>
                    <p className="text-muted text-lg">
                        The same agent. Three stages. No migration required.
                    </p>
                </div>

                {/* Stepper */}
                <div className="flex justify-center mb-12 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -z-10 max-w-2xl mx-auto" />
                    <div className="flex justify-between w-full max-w-2xl">
                        {steps.map((step, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveStep(i)}
                                className="flex flex-col items-center group bg-background px-4"
                            >
                                <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all duration-300 mb-3
                    ${activeStep === i
                                        ? 'border-accent bg-accent text-white scale-110 shadow-[0_0_15px_-5px_var(--color-accent)]'
                                        : activeStep > i
                                            ? 'border-success bg-success/10 text-success'
                                            : 'border-border bg-surface text-muted group-hover:border-primary/50'}
                  `}>
                                    {i + 1}
                                </div>
                                <span className={`text-sm font-medium transition-colors ${activeStep === i ? 'text-primary' : 'text-muted group-hover:text-primary'}`}>
                                    {step.title}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-5xl mx-auto min-h-[500px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeStep}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 lg:grid-cols-5 gap-8"
                        >
                            <div className="lg:col-span-2 flex flex-col justify-center">
                                <h3 className="text-2xl font-bold mb-4">{steps[activeStep].title}</h3>
                                <p className="text-muted text-lg mb-8">{steps[activeStep].desc}</p>
                                {steps[activeStep].detail && (
                                    <div className="p-6 bg-surface border border-border rounded-lg mb-8">
                                        <div className="text-xs font-mono text-muted mb-4 uppercase tracking-wider">Structure</div>
                                        {steps[activeStep].detail}
                                    </div>
                                )}
                            </div>
                            <div className="lg:col-span-3">
                                <CodeBlock code={steps[activeStep].code} className="h-full max-h-[500px] overflow-y-auto" />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="flex justify-center mt-12">
                    <Link to="/playground">
                        <Button variant="secondary">See it live in Playground →</Button>
                    </Link>
                </div>

            </div>
        </section>
    );
}
