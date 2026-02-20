import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/postcss';
import react from '@astrojs/react';

// https://astro.build/config
const isProd = process.env.BRANCH === 'main';
const isDev = process.env.BRANCH === 'dev';
const siteUrl = isProd ? 'https://minions.blog' : (isDev ? 'https://minions.blog' : 'http://localhost:4321');

export default defineConfig({
    site: siteUrl,
    integrations: [
        react(),
        mdx(),
        sitemap()
    ],
    vite: {
        css: {
            postcss: {
                plugins: [tailwindcss()],
            }
        }
    }
});
