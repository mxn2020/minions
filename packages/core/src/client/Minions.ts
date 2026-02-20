import { TypeRegistry } from '../registry/index.js';
import { RelationGraph } from '../relations/index.js';
import { createMinion, updateMinion, softDelete, hardDelete, restoreMinion } from '../lifecycle/index.js';
import type { Minion, MinionType, CreateMinionInput, UpdateMinionInput, RelationType } from '../types/index.js';
import type { StorageAdapter, StorageFilter } from '../storage/index.js';
import type { MinionPlugin } from './Plugin.js';

export interface MinionsConfig {
    plugins?: MinionPlugin[];
    /** Optional storage adapter for persisting minions. */
    storage?: StorageAdapter;
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
 * Orchestrates TypeRegistry and RelationGraph directly, and supports plugin mounting.
 *
 * Pass a `storage` adapter in the config to enable minion persistence:
 *
 * ```typescript
 * const storage = await JsonFileStorageAdapter.create('./data/minions');
 * const minions = new Minions({ storage });
 * const wrapper = minions.create('note', { title: 'Hello', fields: { content: 'World' } });
 * await minions.save(wrapper.data);
 * ```
 */
export class Minions {
    public registry: TypeRegistry;
    public graph: RelationGraph;
    public storage?: StorageAdapter;

    // We allow plugin namespaces to be attached dynamically
    [key: string]: any;

    constructor(config?: MinionsConfig) {
        this.registry = new TypeRegistry();
        this.graph = new RelationGraph();
        this.storage = config?.storage;

        if (config?.plugins) {
            for (const plugin of config.plugins) {
                this[plugin.namespace] = plugin.init(this);
            }
        }
    }

    /**
     * Creates a new minion and returns an enhanced MinionWrapper.
     * Looks up the appropriate schema from the internal TypeRegistry using the slug.
     * 
     * @param typeSlug The slug of the MinionType to create (e.g. "agent")
     * @param input Data for the minion (title, fields, etc.)
     */
    create(typeSlug: string, input: CreateMinionInput): MinionWrapper {
        const type = this.registry.getBySlug(typeSlug);
        if (!type) {
            throw new Error(`MinionType with slug '${typeSlug}' not found in registry.`);
        }

        const { minion, validation } = createMinion(input, type);
        if (!validation.valid) {
            throw new Error(`Validation failed for '${typeSlug}':\\n${validation.errors.map((e: any) => `- ${e.field}: ${e.message}`).join('\\n')}`);
        }

        return new MinionWrapper(minion, this);
    }

    /**
     * Updates an existing minion's data.
     */
    update(minion: Minion, input: UpdateMinionInput): MinionWrapper {
        const type = this.registry.getById(minion.minionTypeId);
        if (!type) {
            throw new Error(`MinionType '${minion.minionTypeId}' not found in registry.`);
        }

        const { minion: updated, validation } = updateMinion(minion, input, type);
        if (!validation.valid) {
            throw new Error(`Validation failed for update:\\n${validation.errors.map((e: any) => `- ${e.field}: ${e.message}`).join('\\n')}`);
        }

        return new MinionWrapper(updated, this);
    }

    /**
     * Soft deletes a minion.
     */
    softDelete(minion: Minion): MinionWrapper {
        return new MinionWrapper(softDelete(minion), this);
    }

    /**
     * Hard deletes a minion from the relation graph.
     * Note: This does not remove it from your external storage.
     */
    hardDelete(minion: Minion): void {
        hardDelete(minion, this.graph);
    }

    /**
     * Restores a soft-deleted minion.
     */
    restore(minion: Minion): MinionWrapper {
        return new MinionWrapper(restoreMinion(minion), this);
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
        await this.requireStorage().set(minion);
    }

    /**
     * Load a minion from the configured storage adapter by ID.
     * Returns `undefined` if the minion does not exist.
     * Throws if no storage adapter has been configured.
     */
    async load(id: string): Promise<Minion | undefined> {
        return this.requireStorage().get(id);
    }

    /**
     * Remove a minion from the configured storage adapter.
     * Also removes all of its relations from the in-memory graph.
     * Throws if no storage adapter has been configured.
     */
    async remove(minion: Minion): Promise<void> {
        hardDelete(minion, this.graph);
        await this.requireStorage().delete(minion.id);
    }

    /**
     * List persisted minions from the configured storage adapter.
     * Throws if no storage adapter has been configured.
     */
    async listMinions(filter?: StorageFilter): Promise<Minion[]> {
        return this.requireStorage().list(filter);
    }

    /**
     * Full-text search across persisted minions.
     * Throws if no storage adapter has been configured.
     */
    async searchMinions(query: string): Promise<Minion[]> {
        return this.requireStorage().search(query);
    }
}

