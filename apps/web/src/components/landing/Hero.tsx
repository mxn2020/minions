
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../shared/Button';
import { AnimatedCodeCycler } from '../shared/AnimatedCodeCycler';
import { flatAgentExample, nestedAgentExample, teamExample } from '../../lib/examples';

export default function Hero() {
    return (
        <section className="relative overflow-hidden pt-20 pb-32">
            <div className="container mx-auto px-4 md:px-6 flex flex-col items-center text-center">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 mb-6">
                        Your AI agents need<br />somewhere to live.
                    </h1>
                    <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-8">
                        Give them a structured home — typed, validated, nestable, and AI-readable.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-16"
                >
                    <Link to="/playground">
                        <Button size="lg">Open Playground →</Button>
                    </Link>
                    <a href="https://github.com/mxn2020/minions" target="_blank" rel="noreferrer">
                        <Button size="lg" variant="ghost">View on GitHub</Button>
                    </a>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="w-full max-w-4xl"
                >
                    <div className="rounded-xl border border-border bg-surface/50 p-1 backdrop-blur-sm shadow-2xl shadow-accent/5">
                        <AnimatedCodeCycler
                            examples={[
                                { label: "Flat Agent", code: flatAgentExample },
                                { label: "Nested Agent", code: nestedAgentExample },
                                { label: "Agent Team", code: teamExample },
                            ]}
                        />
                    </div>
                </motion.div>

            </div>

            {/* Background glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
        </section>
    );
}
