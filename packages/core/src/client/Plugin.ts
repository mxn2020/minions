import { Minions } from './Minions.js';

/**
 * Interface for developing Minions ecosystem plugins.
 * Plugins can attach new namespaces and capabilities to the central `Minions` client.
 */
export interface MinionPlugin {
    /**
     * The namespace under which the plugin will be mounted (e.g., "prompts" for minions.prompts)
     */
    namespace: string;

    /**
     * Called during `Minions` instantiation.
     * @param core The central Minions client instance
     * @returns The enhanced API object that will be mounted at the namespace
     */
    init(core: Minions): any;
}
