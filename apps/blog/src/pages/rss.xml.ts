import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
    const posts = await getCollection('posts', ({ data }) => {
        return import.meta.env.PROD ? data.draft !== true : true;
    });

    return rss({
        title: 'Minions Blog',
        description: 'Updates, tutorials, and releases for Minions — a universal structured object system for AI agents.',
        site: context.site || 'https://minions.wtf',
        items: posts.map((post) => ({
            title: post.data.title,
            pubDate: post.data.date,
            description: post.data.description,
            link: `/posts/${post.id}/`,
            author: post.data.author
        })),
        customData: `<language>en-us</language>`,
    });
};
