import { TypeRegistry } from '../registry/index.js';
import { RelationGraph } from '../relations/index.js';
import { createMinion, updateMinion, softDelete, hardDelete, restoreMinion } from '../lifecycle/index.js';
import type { Minion, MinionType, CreateMinionInput, UpdateMinionInput, RelationType } from '../types/index.js';
import type { StorageAdapter, StorageFilter } from '../storage/index.js';
import type { MinionPlugin } from './Plugin.js';
import type { MinionMiddleware, MinionContext, MinionOperation } from './Middleware.js';
import { runMiddleware } from './Middleware.js';

export interface MinionsConfig {
    plugins?: MinionPlugin[];
    /** Optional storage adapter for persisting minions. */
    storage?: StorageAdapter;
    /**
     * Optional middleware pipeline.
     * Middleware functions are executed in order for every client operation.
     * Each middleware can run logic before and/or after the core operation.
     *
     * @example
     * ```typescript
     * const minions = new Minions({
     *   middleware: [
     *     async (ctx, next) => {
     *       console.log(`→ ${ctx.operation}`, ctx.args);
     *       await next();
     *       console.log(`← ${ctx.operation}`, ctx.result);
     *     },
     *   ],
     * });
     * ```
     */
    middleware?: MinionMiddleware[];
}

/**
 * Enhanced Wrapper for a Minion instance that provides chainable, instance-level methods.
 */
export class MinionWrapper {
    constructor(public data: Minion, private client: Minions) { }

    /**
     * Create a directed relation from this minion to a target minion.
     */
    linkTo(targetId: string, type: RelationType): this {
        this.client.graph.add({
            sourceId: this.data.id,
            targetId,
            type
        });
        return this;
    }
}

/**
 * Central Client facade for the Minions ecosystem.
 * Orchestrates TypeRegistry and RelationGraph directly, and supports
 * plugin mounting and an optional middleware pipeline.
 *
 * Pass a `storage` adapter in the config to enable minion persistence:
 *
 * ```typescript
 * const storage = await JsonFileStorageAdapter.create('./data/minions');
 * const minions = new Minions({ storage });
 * const wrapper = await minions.create('note', { title: 'Hello', fields: { content: 'World' } });
 * await minions.save(wrapper.data);
 * ```
 *
 * Add middleware for cross-cutting concerns:
 *
 * ```typescript
 * const minions = new Minions({
 *   middleware: [
 *     async (ctx, next) => {
 *       console.log(`${ctx.operation} started`);
 *       await next();
 *       console.log(`${ctx.operation} completed`);
 *     },
 *   ],
 * });
 * ```
 */
export class Minions {
    public registry: TypeRegistry;
    public graph: RelationGraph;
    public storage?: StorageAdapter;

    private _middleware: readonly MinionMiddleware[];

    // We allow plugin namespaces to be attached dynamically
    [key: string]: any;

    constructor(config?: MinionsConfig) {
        this.registry = new TypeRegistry();
        this.graph = new RelationGraph();
        this.storage = config?.storage;
        this._middleware = config?.middleware ?? [];

        if (config?.plugins) {
            for (const plugin of config.plugins) {
                this[plugin.namespace] = plugin.init(this);
            }
        }
    }

    // ── Middleware helper ─────────────────────────────────────────────────

    /**
     * Run the middleware pipeline for an operation. If no middleware is
     * configured, `core` is called directly to avoid unnecessary overhead.
     */
    private async _run(
        operation: MinionOperation,
        args: Record<string, unknown>,
        core: (ctx: MinionContext) => Promise<void>,
    ): Promise<MinionContext> {
        const ctx: MinionContext = { operation, args, metadata: {} };

        if (this._middleware.length === 0) {
            await core(ctx);
        } else {
            await runMiddleware(this._middleware, ctx, () => core(ctx));
        }

        return ctx;
    }

    // ── Lifecycle ────────────────────────────────────────────────────────

    /**
     * Creates a new minion and returns an enhanced MinionWrapper.
     * Looks up the appropriate schema from the internal TypeRegistry using the slug.
     *
     * @param typeSlug The slug of the MinionType to create (e.g. "agent")
     * @param input Data for the minion (title, fields, etc.)
     */
    async create(typeSlug: string, input: CreateMinionInput): Promise<MinionWrapper> {
        const ctx = await this._run('create', { typeSlug, input }, async (c) => {
            const type = this.registry.getBySlug(typeSlug);
            if (!type) {
                throw new Error(`MinionType with slug '${typeSlug}' not found in registry.`);
            }

            const { minion, validation } = createMinion(input, type);
            if (!validation.valid) {
                throw new Error(`Validation failed for '${typeSlug}':\\n${validation.errors.map((e: any) => `- ${e.field}: ${e.message}`).join('\\n')}`);
            }

            c.result = minion;
        });

        return new MinionWrapper(ctx.result as Minion, this);
    }

    /**
     * Updates an existing minion's data.
     */
    async update(minion: Minion, input: UpdateMinionInput): Promise<MinionWrapper> {
        const ctx = await this._run('update', { minion, input }, async (c) => {
            const type = this.registry.getById(minion.minionTypeId);
            if (!type) {
                throw new Error(`MinionType '${minion.minionTypeId}' not found in registry.`);
            }

            const { minion: updated, validation } = updateMinion(minion, input, type);
            if (!validation.valid) {
                throw new Error(`Validation failed for update:\\n${validation.errors.map((e: any) => `- ${e.field}: ${e.message}`).join('\\n')}`);
            }

            c.result = updated;
        });

        return new MinionWrapper(ctx.result as Minion, this);
    }

    /**
     * Soft deletes a minion.
     */
    async softDelete(minion: Minion): Promise<MinionWrapper> {
        const ctx = await this._run('softDelete', { minion }, async (c) => {
            c.result = softDelete(minion);
        });

        return new MinionWrapper(ctx.result as Minion, this);
    }

    /**
     * Hard deletes a minion from the relation graph.
     * Note: This does not remove it from your external storage.
     */
    async hardDelete(minion: Minion): Promise<void> {
        await this._run('hardDelete', { minion }, async () => {
            hardDelete(minion, this.graph);
        });
    }

    /**
     * Restores a soft-deleted minion.
     */
    async restore(minion: Minion): Promise<MinionWrapper> {
        const ctx = await this._run('restore', { minion }, async (c) => {
            c.result = restoreMinion(minion);
        });

        return new MinionWrapper(ctx.result as Minion, this);
    }

    // ── Storage helpers ────────────────────────────────────────────────────

    /** @throws {Error} if no storage adapter has been configured. */
    private requireStorage(): StorageAdapter {
        if (!this.storage) {
            throw new Error('No storage adapter configured. Pass a `storage` option to the Minions constructor.');
        }
        return this.storage;
    }

    /**
     * Persist a minion to the configured storage adapter.
     * Throws if no storage adapter has been configured.
     */
    async save(minion: Minion): Promise<void> {
        await this._run('save', { minion }, async () => {
            await this.requireStorage().set(minion);
        });
    }

    /**
     * Load a minion from the configured storage adapter by ID.
     * Returns `undefined` if the minion does not exist.
     * Throws if no storage adapter has been configured.
     */
    async load(id: string): Promise<Minion | undefined> {
        const ctx = await this._run('load', { id }, async (c) => {
            c.result = await this.requireStorage().get(id);
        });

        return ctx.result as Minion | undefined;
    }

    /**
     * Remove a minion from the configured storage adapter.
     * Also removes all of its relations from the in-memory graph.
     * Throws if no storage adapter has been configured.
     */
    async remove(minion: Minion): Promise<void> {
        await this._run('remove', { minion }, async () => {
            hardDelete(minion, this.graph);
            await this.requireStorage().delete(minion.id);
        });
    }

    /**
     * List persisted minions from the configured storage adapter.
     * Throws if no storage adapter has been configured.
     */
    async listMinions(filter?: StorageFilter): Promise<Minion[]> {
        const ctx = await this._run('list', { filter }, async (c) => {
            c.result = await this.requireStorage().list(filter);
        });

        return ctx.result as Minion[];
    }

    /**
     * Full-text search across persisted minions.
     * Throws if no storage adapter has been configured.
     */
    async searchMinions(query: string): Promise<Minion[]> {
        const ctx = await this._run('search', { query }, async (c) => {
            c.result = await this.requireStorage().search(query);
        });

        return ctx.result as Minion[];
    }
}
