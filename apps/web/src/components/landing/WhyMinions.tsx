
import { motion } from 'framer-motion';
import { FileX, Braces, Layers } from 'lucide-react';

export default function WhyMinions() {
    const cards = [
        {
            icon: FileX,
            title: "Config files",
            desc: "Scattered across your repo. Not queryable. Break silently when structure changes.",
            highlight: false
        },
        {
            icon: Braces,
            title: "Plain JSON",
            desc: "No validation. No relations. No way to know if your agent definition is even valid.",
            highlight: false
        },
        {
            icon: Layers,
            title: "Minions ✓",
            desc: "Typed. Validated. Nestable. Evolvable. Your agent definitions as first-class structured objects.",
            highlight: true
        }
    ];

    return (
        <section className="py-24 bg-background border-t border-border">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">
                        Agent frameworks give you execution. Not structure.
                    </h2>
                    <p className="text-muted text-lg max-w-2xl mx-auto">
                        Current tools leave your agent's identity, memory, and configuration scattered and fragile.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {cards.map((card, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className={`
                relative p-8 rounded-xl border bg-surface/50 backdrop-blur-sm
                ${card.highlight ? 'border-accent shadow-[0_0_30px_-10px_rgba(124,58,237,0.3)]' : 'border-border'}
              `}
                        >
                            <div className={`
                w-12 h-12 rounded-lg flex items-center justify-center mb-6
                ${card.highlight ? 'bg-accent/20 text-accent' : 'bg-white/5 text-muted'}
              `}>
                                <card.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                            <p className="text-muted leading-relaxed">{card.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
