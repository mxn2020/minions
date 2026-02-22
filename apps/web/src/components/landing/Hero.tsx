
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../shared/Button';
import { AnimatedCodeCycler } from '../shared/AnimatedCodeCycler';
import { flatAgentExample, nestedAgentExample, teamExample } from '../../lib/examples';
import { Zap, Shield, Scale } from 'lucide-react';

const featurePills = [
    { icon: Zap, label: 'Type-Safe' },
    { icon: Shield, label: 'Zero Config' },
    { icon: Scale, label: 'MIT License' },
];

export default function Hero() {
    return (
        <section className="relative overflow-hidden py-20 md:py-32">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

                    {/* Left Side — Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex-1 text-center lg:text-left"
                    >
                        {/* Version Badge */}
                        <motion.span
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-6"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                            v0.1.0
                        </motion.span>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 mb-6 leading-tight">
                            Your AI agents need<br />somewhere to live.
                        </h1>

                        <p className="text-lg md:text-xl text-muted max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                            Give them a structured home — typed, validated, nestable, and AI-readable. The universal object system for the agentic era.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                            <Link to="/playground">
                                <Button size="lg">Open Playground →</Button>
                            </Link>
                            <a href="https://github.com/mxn2020/minions" target="_blank" rel="noreferrer">
                                <Button size="lg" variant="ghost">View on GitHub</Button>
                            </a>
                        </div>

                        {/* Feature Pills */}
                        <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                            {featurePills.map((pill) => (
                                <span
                                    key={pill.label}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border text-sm text-muted"
                                >
                                    <pill.icon className="w-3.5 h-3.5 text-accent" />
                                    {pill.label}
                                </span>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right Side — Code Block */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex-1 w-full max-w-2xl lg:max-w-none"
                    >
                        <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-sm shadow-2xl shadow-accent/5 overflow-hidden">
                            {/* Terminal Header */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface/80">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                                </div>
                                <span className="text-xs text-muted ml-2 font-mono">minion.json</span>
                            </div>
                            {/* Code Area */}
                            <div className="max-h-[480px] overflow-y-auto scrollbar-thin">
                                <AnimatedCodeCycler
                                    examples={[
                                        { label: "Flat Agent", code: flatAgentExample },
                                        { label: "Nested Agent", code: nestedAgentExample },
                                        { label: "Agent Team", code: teamExample },
                                    ]}
                                />
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>

            {/* Background glow effect */}
            <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-accent/8 rounded-full blur-[120px] -z-10 pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
        </section>
    );
}
