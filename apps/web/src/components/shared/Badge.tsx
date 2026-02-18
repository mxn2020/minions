
import React from 'react';

interface BadgeProps {
    variant?: 'default' | 'success' | 'error' | 'warning';
    children: React.ReactNode;
}

export function Badge({ variant = 'default', children }: BadgeProps) {
    const variants = {
        default: "bg-surface border-border text-muted",
        success: "bg-success/10 text-success border-success/20",
        error: "bg-error/10 text-error border-error/20",
        warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none ${variants[variant]}`}>
            {children}
        </span>
    );
}
