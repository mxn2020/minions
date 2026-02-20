
import { Link } from 'react-router-dom';
import { Button } from '../shared/Button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <Link to="/" className="flex items-center space-x-2">
                    <span className="font-mono text-xl font-bold text-primary">⚡ minions</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center space-x-6">
                    <a href="/docs" target="_blank" rel="noreferrer" className="text-sm font-medium text-muted transition-colors hover:text-primary">Docs</a>
                    <Link to="/playground" className="text-sm font-medium text-muted transition-colors hover:text-primary">Playground</Link>
                    <a href="https://github.com/mxn2020/minions" target="_blank" rel="noreferrer" className="flex items-center space-x-1 text-sm font-medium text-muted transition-colors hover:text-primary">
                        <span>GitHub</span>
                        <span className="ml-1 inline-flex items-center rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold">★ Star</span>
                    </a>
                    <Link to="/playground">
                        <Button size="sm">Open Playground</Button>
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button className="md:hidden text-muted hover:text-primary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden border-b border-border bg-surface"
                    >
                        <div className="flex flex-col space-y-4 p-4">
                            <a href="/docs" target="_blank" rel="noreferrer" className="text-sm font-medium text-muted hover:text-primary">Docs</a>
                            <Link to="/playground" className="text-sm font-medium text-muted hover:text-primary">Playground</Link>
                            <a href="https://github.com/mxn2020/minions" className="text-sm font-medium text-muted hover:text-primary">GitHub</a>
                            <Link to="/playground">
                                <Button className="w-full">Open Playground</Button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
