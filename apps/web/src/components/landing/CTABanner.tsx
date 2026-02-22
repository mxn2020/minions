
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';

export default function CTABanner() {
    return (
        <section className="py-20 px-4 md:px-6">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="container mx-auto"
            >
                <div className="relative overflow-hidden rounded-2xl bg-accent p-12 md:p-16 text-center">
                    {/* Abstract pattern overlay */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-full h-full"
                            style={{
                                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%),
                                                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%),
                                                  radial-gradient(circle at 50% 80%, rgba(255,255,255,0.15) 0%, transparent 45%)`
                            }}
                        />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Ready to structure your AI agents?
                        </h2>
                        <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-8">
                            Start building with the universal structured object system. Type-safe, validated, and ready for production.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/playground"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-accent font-semibold rounded-lg hover:bg-white/90 transition-colors"
                            >
                                Get Started
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <a
                                href="https://minions.help"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm"
                            >
                                <BookOpen className="w-4 h-4" />
                                View Docs
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
