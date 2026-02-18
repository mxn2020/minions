import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Minions',
      description: 'A universal structured object system for AI agents',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/mxn2020/minions' },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/' },
            { label: 'Quick Start', link: '/guides/quickstart/' },
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
            { label: 'Field Types', link: '/reference/field-types/' },
            { label: 'Relation Types', link: '/reference/relation-types/' },
            { label: 'Built-in Types', link: '/reference/builtin-types/' },
            { label: 'Conformance', link: '/reference/conformance/' },
          ],
        },
      ],
    }),
  ],
});
