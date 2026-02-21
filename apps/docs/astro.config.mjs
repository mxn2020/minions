import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const isProd = process.env.BRANCH === 'main';
const isDev = process.env.BRANCH === 'dev';
const siteUrl = isProd ? 'https://minions.help' : (isDev ? 'https://minions.help' : 'http://localhost:4321');

export default defineConfig({
  site: siteUrl,
  integrations: [
    starlight({
      title: 'Minions',
      description: 'A universal structured object system for AI agents',
      head: [
        { tag: 'meta', attrs: { property: 'og:image', content: '/og-image.png' } },
      ],
      components: {
        Head: './src/components/CopyMarkdownButton.astro',
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/mxn2020/minions' },
        { icon: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/mnx/' },
        { icon: 'external', label: 'App', href: 'https://www.minions.wtf' },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/guides/introduction/' },
            { label: 'Quick Start', link: '/guides/quickstart/' },
            { label: 'Contributing', link: '/guides/contributing/' },
          ],
        },
        {
          label: 'Core Concepts',
          items: [
            { label: 'Primitives', link: '/guides/primitives/' },
            { label: 'Layer Model', link: '/guides/layers/' },
            { label: 'Lifecycle', link: '/guides/lifecycle/' },
            { label: 'Schema Evolution', link: '/guides/evolution/' },
          ],
        },
        {
          label: 'Tutorial',
          items: [
            { label: 'Build an AI Agent', link: '/tutorial/agent/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'API Reference', link: '/reference/api-reference/' },
            { label: 'Field Types', link: '/reference/field-types/' },
            { label: 'Relation Types', link: '/reference/relation-types/' },
            { label: 'Built-in Types', link: '/reference/builtin-types/' },
            { label: 'Conformance', link: '/reference/conformance/' },
            { label: 'Storage Adapters', link: '/guides/storage/' },
          ],
        },
        {
          label: 'Built-in Types',
          collapsed: true,
          items: [
            { label: 'Note', link: '/reference/types/note/' },
            { label: 'Link', link: '/reference/types/link/' },
            { label: 'File', link: '/reference/types/file/' },
            { label: 'Contact', link: '/reference/types/contact/' },
            { label: 'Agent', link: '/reference/types/agent/' },
            { label: 'Team', link: '/reference/types/team/' },
            { label: 'Thought', link: '/reference/types/thought/' },
            { label: 'Prompt Template', link: '/reference/types/prompt-template/' },
            { label: 'Test Case', link: '/reference/types/test-case/' },
            { label: 'Task', link: '/reference/types/task/' },
          ],
        },
      ],
    }),
  ],
});
