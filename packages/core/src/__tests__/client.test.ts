import { describe, it, expect, vi } from 'vitest';
import { Minions, MinionPlugin } from '../client/index.js';
import type { MinionMiddleware, MinionContext } from '../client/index.js';

describe('Minions Client', () => {
    it('should initialize and create a minion', async () => {
        const minions = new Minions();

        const wrapper = await minions.create('agent', {
            title: 'Test Agent',
            fields: { role: 'tester', model: 'gpt-4' }
        });

        expect(wrapper.data.id).toBeDefined();
        expect(wrapper.data.title).toBe('Test Agent');
        expect(wrapper.data.minionTypeId).toBe('builtin-agent');
        expect(wrapper.data.fields.role).toBe('tester');
    });

    it('should link minions', async () => {
        const minions = new Minions();
        const agent = await minions.create('agent', { title: 'Agent', fields: { role: 'tester' } });
        const skill = await minions.create('note', { title: 'Note', fields: { content: 'hello' } });

        agent.linkTo(skill.data.id, 'parent_of');

        const children = minions.graph.getChildren(agent.data.id);
        expect(children).toHaveLength(1);
        expect(children[0]).toBe(skill.data.id);
    });

    it('should support plugins', () => {
        class MockPlugin implements MinionPlugin {
            namespace = 'mock';
            init(core: Minions) {
                return {
                    sayHello: () => 'hello',
                    client: core
                };
            }
        }

        const minions = new Minions({ plugins: [new MockPlugin()] });
        expect(minions.mock).toBeDefined();
        expect(minions.mock.sayHello()).toBe('hello');
        expect(minions.mock.client).toBe(minions);
    });
});

// ─── Middleware Tests ────────────────────────────────────────────────────────

describe('Middleware Pipeline', () => {
    it('should execute middleware in order (onion model)', async () => {
        const order: string[] = [];

        const mw1: MinionMiddleware = async (_ctx, next) => {
            order.push('mw1-before');
            await next();
            order.push('mw1-after');
        };

        const mw2: MinionMiddleware = async (_ctx, next) => {
            order.push('mw2-before');
            await next();
            order.push('mw2-after');
        };

        const minions = new Minions({ middleware: [mw1, mw2] });
        await minions.create('note', { title: 'Test', fields: { content: 'hello' } });

        expect(order).toEqual(['mw1-before', 'mw2-before', 'mw2-after', 'mw1-after']);
    });

    it('should populate context with operation and args', async () => {
        let captured: MinionContext | undefined;

        const spy: MinionMiddleware = async (ctx, next) => {
            captured = { ...ctx, args: { ...ctx.args }, metadata: { ...ctx.metadata } };
            await next();
        };

        const minions = new Minions({ middleware: [spy] });
        await minions.create('note', { title: 'Spy Test', fields: { content: 'data' } });

        expect(captured).toBeDefined();
        expect(captured!.operation).toBe('create');
        expect(captured!.args.typeSlug).toBe('note');
        expect(captured!.args.input).toEqual({ title: 'Spy Test', fields: { content: 'data' } });
    });

    it('should populate context.result after core executes', async () => {
        let resultAfter: unknown;

        const spy: MinionMiddleware = async (ctx, next) => {
            expect(ctx.result).toBeUndefined();
            await next();
            resultAfter = ctx.result;
        };

        const minions = new Minions({ middleware: [spy] });
        const wrapper = await minions.create('note', { title: 'Result Test', fields: { content: 'x' } });

        expect(resultAfter).toBeDefined();
        expect((resultAfter as any).id).toBe(wrapper.data.id);
    });

    it('should allow short-circuiting by skipping next()', async () => {
        const coreSpy = vi.fn();

        const blocker: MinionMiddleware = async (ctx, _next) => {
            // Do NOT call next() — short-circuit
            ctx.result = {
                id: 'mock-id',
                title: 'Blocked',
                minionTypeId: 'builtin-note',
                fields: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        };

        const minions = new Minions({ middleware: [blocker] });
        const wrapper = await minions.create('note', { title: 'Original', fields: { content: 'x' } });

        expect(wrapper.data.title).toBe('Blocked');
        expect(wrapper.data.id).toBe('mock-id');
    });

    it('should propagate errors from middleware', async () => {
        const failing: MinionMiddleware = async (_ctx, _next) => {
            throw new Error('Auth denied');
        };

        const minions = new Minions({ middleware: [failing] });
        await expect(minions.create('note', { title: 'X', fields: { content: 'y' } }))
            .rejects.toThrow('Auth denied');
    });

    it('should allow cross-middleware communication via metadata', async () => {
        const setter: MinionMiddleware = async (ctx, next) => {
            ctx.metadata.userId = 'user-123';
            await next();
        };

        const reader: MinionMiddleware = async (ctx, next) => {
            expect(ctx.metadata.userId).toBe('user-123');
            await next();
        };

        const minions = new Minions({ middleware: [setter, reader] });
        await minions.create('note', { title: 'Meta', fields: { content: 'test' } });
    });

    it('should work for async storage operations', async () => {
        const { MemoryStorageAdapter } = await import('../storage/index.js');
        const log: string[] = [];

        const logger: MinionMiddleware = async (ctx, next) => {
            log.push(`before:${ctx.operation}`);
            await next();
            log.push(`after:${ctx.operation}`);
        };

        const storage = new MemoryStorageAdapter();
        const minions = new Minions({ middleware: [logger], storage });

        const wrapper = await minions.create('note', { title: 'Logged', fields: { content: 'a' } });
        await minions.save(wrapper.data);
        await minions.load(wrapper.data.id);
        await minions.listMinions();
        await minions.searchMinions('logged');

        expect(log).toEqual([
            'before:create', 'after:create',
            'before:save', 'after:save',
            'before:load', 'after:load',
            'before:list', 'after:list',
            'before:search', 'after:search',
        ]);
    });

    it('should pass through cleanly when no middleware is configured', async () => {
        const minions = new Minions();
        const wrapper = await minions.create('note', { title: 'No MW', fields: { content: 'plain' } });
        expect(wrapper.data.title).toBe('No MW');
    });
});
