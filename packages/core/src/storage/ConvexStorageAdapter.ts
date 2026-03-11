/**
 * @module minions-sdk/storage/convex
 * ConvexDB storage adapter for the Minions structured object system.
 *
 * Requires the `convex` package as a peer dependency.
 *
 * @example
 * ```typescript
 * import { ConvexClient } from 'convex/browser';
 * import { ConvexStorageAdapter } from 'minions-sdk';
 *
 * const client = new ConvexClient('https://your-deployment.convex.cloud');
 * const storage = new ConvexStorageAdapter(client);
 *
 * const minions = new Minions({ storage });
 * ```
 */

import type { Minion } from '../types/index.js';
import type { StorageAdapter, StorageFilter } from './StorageAdapter.js';
import { applyFilter } from './filterUtils.js';

// ─── Convex Client Types ─────────────────────────────────────────────────────
//
// We define minimal type interfaces instead of importing from the `convex`
// package directly.  This lets the adapter compile without `convex` installed
// (it is an optional peer dependency) and avoids version-lock issues.

/** Minimal interface for a Convex query/mutation function reference. */
export interface ConvexFunctionReference {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

/**
 * Minimal interface for a Convex client.
 *
 * Any object that exposes `query` and `mutation` methods matching the Convex
 * `ConvexClient` / `ConvexReactClient` contract will work.
 */
export interface ConvexClientLike {
    query(functionReference: ConvexFunctionReference, args?: Record<string, unknown>): Promise<unknown>;
    mutation(functionReference: ConvexFunctionReference, args?: Record<string, unknown>): Promise<unknown>;
}

// ─── Configuration ───────────────────────────────────────────────────────────

/** Options for the Convex storage adapter. */
export interface ConvexStorageOptions {
    /**
     * Convex function references for the CRUD operations.
     *
     * You must deploy a Convex module that exposes these functions.
     * A reference implementation is provided in the docs.
     */
    functions: {
        /** Query: get a single minion by `id` field. Returns `null` if not found. */
        get: ConvexFunctionReference;
        /** Query: list all minions. Returns an array of minion documents. */
        list: ConvexFunctionReference;
        /** Mutation: upsert a minion document (full replacement). */
        set: ConvexFunctionReference;
        /** Mutation: delete a minion document by `id` field. */
        delete: ConvexFunctionReference;
    };
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

/**
 * Storage adapter backed by **ConvexDB**.
 *
 * Delegates CRUD operations to user-defined Convex query/mutation functions
 * via the Convex client.  Filtering, sorting and pagination are applied
 * client-side using the shared {@link applyFilter} utility.
 *
 * **Setup**: You need to deploy a Convex module that stores minions as
 * documents with a string `id` field (the Minion UUID), plus the rest of the
 * Minion properties.  Then pass the function references to the constructor.
 *
 * @example Convex schema (`convex/schema.ts`):
 * ```typescript
 * import { defineSchema, defineTable } from 'convex/server';
 * import { v } from 'convex/values';
 *
 * export default defineSchema({
 *   minions: defineTable({
 *     id: v.string(),          // Minion UUID
 *     data: v.string(),        // JSON-serialised Minion object
 *   }).index('by_id', ['id']),
 * });
 * ```
 *
 * @example Convex functions (`convex/minions.ts`):
 * ```typescript
 * import { query, mutation } from './_generated/server';
 * import { v } from 'convex/values';
 *
 * export const get = query({
 *   args: { id: v.string() },
 *   handler: async (ctx, { id }) => {
 *     return await ctx.db.query('minions').withIndex('by_id', q => q.eq('id', id)).unique();
 *   },
 * });
 *
 * export const list = query({
 *   handler: async (ctx) => {
 *     return await ctx.db.query('minions').collect();
 *   },
 * });
 *
 * export const set = mutation({
 *   args: { id: v.string(), data: v.string() },
 *   handler: async (ctx, { id, data }) => {
 *     const existing = await ctx.db.query('minions').withIndex('by_id', q => q.eq('id', id)).unique();
 *     if (existing) {
 *       await ctx.db.patch(existing._id, { data });
 *     } else {
 *       await ctx.db.insert('minions', { id, data });
 *     }
 *   },
 * });
 *
 * export const remove = mutation({
 *   args: { id: v.string() },
 *   handler: async (ctx, { id }) => {
 *     const existing = await ctx.db.query('minions').withIndex('by_id', q => q.eq('id', id)).unique();
 *     if (existing) await ctx.db.delete(existing._id);
 *   },
 * });
 * ```
 */
export class ConvexStorageAdapter implements StorageAdapter {
    private client: ConvexClientLike;
    private fns: ConvexStorageOptions['functions'];

    constructor(client: ConvexClientLike, options: ConvexStorageOptions) {
        this.client = client;
        this.fns = options.functions;
    }

    async get(id: string): Promise<Minion | undefined> {
        const doc = (await this.client.query(this.fns.get, { id })) as
            | { data: string }
            | null;

        if (!doc) return undefined;
        return JSON.parse(doc.data) as Minion;
    }

    async set(minion: Minion): Promise<void> {
        await this.client.mutation(this.fns.set, {
            id: minion.id,
            data: JSON.stringify(minion),
        });
    }

    async delete(id: string): Promise<void> {
        await this.client.mutation(this.fns.delete, { id });
    }

    async list(filter?: StorageFilter): Promise<Minion[]> {
        const docs = (await this.client.query(this.fns.list)) as
            | Array<{ data: string }>
            | null;

        const all = (docs ?? []).map((d) => JSON.parse(d.data) as Minion);

        if (!filter) {
            return all.filter((m) => !m.deletedAt);
        }
        return applyFilter(all, filter);
    }

    async search(query: string): Promise<Minion[]> {
        if (!query.trim()) return this.list();

        const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
        const all = await this.list();

        return all.filter((m) => {
            const text = (m.searchableText ?? m.title).toLowerCase();
            return tokens.every((token) => text.includes(token));
        });
    }
}
