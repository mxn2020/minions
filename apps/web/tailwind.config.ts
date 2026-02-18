
import type { Config } from 'tailwindcss';

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#080808',
                surface: '#111111',
                border: '#1f1f1f',
                primary: '#f0f0f0',
                muted: '#666666',
                accent: {
                    DEFAULT: '#7c3aed',
                    hover: '#6d28d9',
                },
                success: '#10b981',
                error: '#ef4444',
            },
            fontFamily: {
                mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'],
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
    darkMode: 'class',
} satisfies Config;
