
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CodeBlock } from './CodeBlock';

interface Example {
    label: string;
    code: string;
}

interface AnimatedCodeCyclerProps {
    examples: Example[];
}

export function AnimatedCodeCycler({ examples }: AnimatedCodeCyclerProps) {
    const [index, setIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (isHovered) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % examples.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [examples.length, isHovered]);

    return (
        <div
            className="w-full text-left mt-6"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex justify-center space-x-2 mb-4">
                {examples.map((ex, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`
              px-3 py-1 text-xs rounded-full transition-colors duration-300
              ${i === index ? 'bg-accent text-white' : 'bg-surface text-muted hover:text-primary border border-border'}
            `}
                    >
                        {ex.label}
                    </button>
                ))}
            </div>
            <div className="relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <CodeBlock code={examples[index].code} className="min-h-[400px]" />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

