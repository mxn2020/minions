import { describe, it, expect } from 'vitest';
import { Minions, MinionPlugin } from '../client/index.js';

describe('Minions Client', () => {
    it('should initialize and create a minion', () => {
        const minions = new Minions();

        const wrapper = minions.create('agent', {
            title: 'Test Agent',
            fields: { role: 'tester', model: 'gpt-4' }
        });

        expect(wrapper.data.id).toBeDefined();
        expect(wrapper.data.title).toBe('Test Agent');
        expect(wrapper.data.minionTypeId).toBe('builtin-agent');
        expect(wrapper.data.fields.role).toBe('tester');
    });

    it('should link minions', () => {
        const minions = new Minions();
        const agent = minions.create('agent', { title: 'Agent', fields: { role: 'tester' } });
        const skill = minions.create('note', { title: 'Note', fields: { content: 'hello' } });

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
