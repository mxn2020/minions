
import { motion } from 'framer-motion';
import { Box, Shapes, GitBranch } from 'lucide-react';
import { CodeBlock } from '../shared/CodeBlock';

export default function Primitives() {
    const cards = [
        {
            icon: Box,
            title: "Minion",
            desc: "A structured object instance. Every agent, skill, note, or task is a minion.",
            code: `interface Minion {
  id: string;
  minionTypeId: string;
  fields: Record<string, any>;
}`
        },
        {
            icon: Shapes,
            title: "MinionType",
            desc: "The schema that defines a kind of minion. Specifies fields, types, and validation.",
            code: `interface MinionType {
  id: string;
  slug: string;
  schema: FieldDefinition[];
}`
        },
        {
            icon: GitBranch,
            title: "Relation",
            desc: "A typed, directional link between two minions. Builds hierarchies and graphs.",
            code: `interface Relation {
  sourceId: string;
  targetId: string;
  type: RelationType;
}`
        }
    ];

    return (
        <section className="py-24 bg-surface/30 border-t border-border">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl font-bold tracking-tight mb-16 text-center">
                    Everything from three ideas.
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {cards.map((card, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            whileHover={{ y: -5, borderColor: 'var(--color-primary)' }}
                            className="p-8 rounded-xl border border-border bg-background transition-colors group hover:border-white/20"
                        >
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="p-3 rounded-lg bg-surface border border-border group-hover:bg-white/5 transition-colors">
                                    <card.icon className="w-6 h-6 text-accent" />
                                </div>
                                <h3 className="text-xl font-bold">{card.title}</h3>
                            </div>

                            <p className="text-muted mb-6 h-12">{card.desc}</p>

                            <CodeBlock
                                code={card.code}
                                language="typescript"
                                className="text-xs opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
