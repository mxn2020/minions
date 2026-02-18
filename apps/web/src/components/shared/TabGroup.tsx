
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
    id: string;
    label: string;
    content: React.ReactNode;
}

interface TabGroupProps {
    tabs: Tab[];
}

export function TabGroup({ tabs }: TabGroupProps) {
    const [activeTab, setActiveTab] = useState(tabs[0].id);

    return (
        <div className="flex flex-col w-full">
            <div className="flex border-b border-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
              relative px-4 py-2 text-sm font-medium transition-colors
              ${activeTab === tab.id ? 'text-primary' : 'text-muted hover:text-primary'}
            `}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                            />
                        )}
                    </button>
                ))}
            </div>
            <div className="mt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                    >
                        {tabs.find(t => t.id === activeTab)?.content}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
