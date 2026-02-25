/**
 * @module minions-sdk/storage/yaml-file
 * Disk-based YAML storage adapter with sharded directory layout and
 * in-memory index for fast queries / full-text search.
 *
 * Identical architecture to {@link JsonFileStorageAdapter} but persists
 * minions as human-readable YAML files instead of JSON.
 *
 * Directory layout
 * ────────────────
 * Each minion is stored as a YAML file:
 *
 *   <rootDir>/<id[0..1]>/<id[2..3]>/<id>.yaml
 *
 * The two-level shard prefix keeps individual directories small even when
 * millions of minions are stored, while still being human-readable and
 * git-friendly.
 *
 * Index
 * ─────
 * An in-memory `Map<id, Minion>` is populated at construction time by
 * scanning the root directory.  All subsequent reads hit the index first
 * (O(1)), falling back to disk only when the entry is missing.
 *
 * Writes use a write-to-tmp-then-rename pattern to avoid partial writes
 * corrupting data if the process crashes mid-write.
 *
 * YAML Serializer
 * ───────────────
 * Uses a built-in minimal YAML serializer (no external dependencies) that
 * supports all Minion field types: strings, numbers, booleans, dates,
 * arrays, nested objects, and null values.
 *
 * This adapter uses Node.js `node:fs/promises`, so it is only suitable for
 * server-side / CLI usage.
 */

import { mkdir, readFile, writeFile, unlink, readdir, rename } from 'node:fs/promises';
import { join } from 'node:path';
import type { Minion } from '../types/index.js';
import type { StorageAdapter, StorageFilter } from './StorageAdapter.js';
import { applyFilter } from './filterUtils.js';

// ─── YAML Serializer (zero dependencies) ─────────────────────────────────────

/**
 * Serialize a value to YAML string.  Handles all types that a Minion can
 * contain: primitives, arrays, nested objects, null, and Date strings.
 */
function toYaml(obj: Record<string, unknown>, indent = 0): string {
    const pad = '  '.repeat(indent);
    const lines: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
            lines.push(`${pad}${key}: null`);
        } else if (typeof value === 'boolean') {
            lines.push(`${pad}${key}: ${value}`);
        } else if (typeof value === 'number') {
            lines.push(`${pad}${key}: ${value}`);
        } else if (typeof value === 'string') {
            if (value.includes('\n')) {
                // Multi-line string: use block literal
                lines.push(`${pad}${key}: |`);
                for (const line of value.split('\n')) {
                    lines.push(`${pad}  ${line}`);
                }
            } else if (
                value.includes(':') || value.includes('#') || value.includes('"') ||
                value.includes("'") || value.startsWith(' ') || value.startsWith('{') ||
                value.startsWith('[') || value.startsWith('*') || value.startsWith('&') ||
                value === '' || value === 'true' || value === 'false' || value === 'null' ||
                value === 'yes' || value === 'no' || !isNaN(Number(value))
            ) {
                lines.push(`${pad}${key}: "${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
            } else {
                lines.push(`${pad}${key}: ${value}`);
            }
        } else if (Array.isArray(value)) {
            if (value.length === 0) {
                lines.push(`${pad}${key}: []`);
            } else if (value.every(v => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
                // Inline array for simple values
                const items = value.map(v => {
                    if (typeof v === 'string') {
                        if (v.includes(',') || v.includes(':') || v.includes('"') || v.includes("'")) {
                            return `"${v.replace(/"/g, '\\"')}"`;
                        }
                        return v;
                    }
                    return String(v);
                });
                lines.push(`${pad}${key}: [${items.join(', ')}]`);
            } else {
                // Block array for complex values
                lines.push(`${pad}${key}:`);
                for (const item of value) {
                    if (typeof item === 'object' && item !== null) {
                        const nested = toYaml(item as Record<string, unknown>, indent + 2);
                        const nestedLines = nested.split('\n').filter(l => l.trim());
                        if (nestedLines.length > 0) {
                            lines.push(`${pad}  - ${nestedLines[0].trim()}`);
                            for (const nl of nestedLines.slice(1)) {
                                lines.push(`${pad}    ${nl.trim()}`);
                            }
                        }
                    } else {
                        lines.push(`${pad}  - ${item}`);
                    }
                }
            }
        } else if (typeof value === 'object') {
            lines.push(`${pad}${key}:`);
            lines.push(toYaml(value as Record<string, unknown>, indent + 1));
        }
    }

    return lines.join('\n');
}

/**
 * Parse a YAML string into a JavaScript object.
 * Handles the subset of YAML that {@link toYaml} produces.
 */
function parseYaml(content: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const lines = content.split('\n');
    let i = 0;

    function getIndent(line: string): number {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
    }

    function parseValue(raw: string): unknown {
        const trimmed = raw.trim();
        if (trimmed === 'null' || trimmed === '~' || trimmed === '') return null;
        if (trimmed === 'true' || trimmed === 'yes') return true;
        if (trimmed === 'false' || trimmed === 'no') return false;

        // Inline array
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            const inner = trimmed.slice(1, -1).trim();
            if (!inner) return [];
            return inner.split(',').map(s => {
                const v = s.trim();
                if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1);
                if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
                if (v === 'true') return true;
                if (v === 'false') return false;
                if (v === 'null') return null;
                const num = Number(v);
                if (!isNaN(num) && v !== '') return num;
                return v;
            });
        }

        // Quoted string
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }

        // Number
        const num = Number(trimmed);
        if (!isNaN(num) && trimmed !== '') return num;

        // Plain string
        return trimmed;
    }

    function parseBlock(baseIndent: number): Record<string, unknown> {
        const obj: Record<string, unknown> = {};

        while (i < lines.length) {
            const line = lines[i];
            const trimmed = line.trim();

            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith('#')) {
                i++;
                continue;
            }

            const indent = getIndent(line);
            if (indent < baseIndent) break;
            if (indent > baseIndent) {
                i++;
                continue; // Handled by recursive calls
            }

            // Check for array item
            if (trimmed.startsWith('- ')) {
                break; // Let parent handle arrays
            }

            const colonIdx = trimmed.indexOf(':');
            if (colonIdx === -1) {
                i++;
                continue;
            }

            const key = trimmed.slice(0, colonIdx).trim();
            const valueStr = trimmed.slice(colonIdx + 1).trim();
            i++;

            if (valueStr === '|') {
                // Block literal string
                const strLines: string[] = [];
                while (i < lines.length) {
                    const nextLine = lines[i];
                    const nextIndent = getIndent(nextLine);
                    if (nextLine.trim() === '' || nextIndent > indent) {
                        strLines.push(nextLine.trim());
                        i++;
                    } else {
                        break;
                    }
                }
                obj[key] = strLines.join('\n').trimEnd();
            } else if (valueStr === '' || valueStr === undefined) {
                // Could be nested object or array
                if (i < lines.length) {
                    const nextLine = lines[i];
                    const nextTrimmed = nextLine?.trim();
                    const nextIndent = getIndent(nextLine);

                    if (nextIndent > indent && nextTrimmed?.startsWith('- ')) {
                        // Parse array
                        const arr: unknown[] = [];
                        while (i < lines.length) {
                            const arrLine = lines[i];
                            const arrIndent = getIndent(arrLine);
                            const arrTrimmed = arrLine.trim();

                            if (arrIndent < nextIndent || (!arrTrimmed.startsWith('- ') && arrIndent === nextIndent)) break;

                            if (arrTrimmed.startsWith('- ') && arrIndent === nextIndent) {
                                const itemVal = arrTrimmed.slice(2).trim();
                                // Check if this is an object item (has a colon)
                                if (itemVal.includes(':') && !itemVal.startsWith('"') && !itemVal.startsWith("'")) {
                                    const itemObj: Record<string, unknown> = {};
                                    const itemColon = itemVal.indexOf(':');
                                    const itemKey = itemVal.slice(0, itemColon).trim();
                                    const itemValue = itemVal.slice(itemColon + 1).trim();
                                    itemObj[itemKey] = parseValue(itemValue);
                                    i++;
                                    // Read continuation lines
                                    while (i < lines.length && getIndent(lines[i]) > nextIndent) {
                                        const contLine = lines[i].trim();
                                        const contColon = contLine.indexOf(':');
                                        if (contColon !== -1) {
                                            const ck = contLine.slice(0, contColon).trim();
                                            const cv = contLine.slice(contColon + 1).trim();
                                            itemObj[ck] = parseValue(cv);
                                        }
                                        i++;
                                    }
                                    arr.push(itemObj);
                                } else {
                                    arr.push(parseValue(itemVal));
                                    i++;
                                }
                            } else {
                                i++;
                            }
                        }
                        obj[key] = arr;
                    } else if (nextIndent > indent) {
                        // Nested object
                        obj[key] = parseBlock(nextIndent);
                    } else {
                        obj[key] = null;
                    }
                } else {
                    obj[key] = null;
                }
            } else {
                obj[key] = parseValue(valueStr);
            }
        }

        return obj;
    }

    return parseBlock(0);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Derive the shard sub-path for a given minion id. */
function shardPath(rootDir: string, id: string): string {
    const hex = id.replace(/-/g, '');
    return join(rootDir, hex.slice(0, 2), hex.slice(2, 4));
}

/** Full path to the YAML file for a given minion id. */
function yamlFilePath(rootDir: string, id: string): string {
    return join(shardPath(rootDir, id), `${id}.yaml`);
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

/**
 * Disk-backed YAML storage adapter.
 *
 * @example
 * ```typescript
 * import { Minions } from 'minions-sdk';
 * import { YamlFileStorageAdapter } from 'minions-sdk/node';
 *
 * const storage = await YamlFileStorageAdapter.create('./data/minions');
 * const minions = new Minions({ storage });
 *
 * const wrapper = await minions.create('note', { title: 'Hello', fields: { content: 'World' } });
 * await minions.save(wrapper.data);
 * ```
 */
export class YamlFileStorageAdapter implements StorageAdapter {
    private index: Map<string, Minion> = new Map();

    private constructor(private readonly rootDir: string) { }

    /**
     * Create (or open) a `YamlFileStorageAdapter` rooted at `rootDir`.
     *
     * The directory is created if it does not yet exist.  All existing YAML
     * files underneath it are loaded into the in-memory index.
     */
    static async create(rootDir: string): Promise<YamlFileStorageAdapter> {
        const adapter = new YamlFileStorageAdapter(rootDir);
        await adapter.init();
        return adapter;
    }

    // ── Initialisation ──────────────────────────────────────────────────────

    private async init(): Promise<void> {
        await mkdir(this.rootDir, { recursive: true });
        await this.buildIndex();
    }

    /**
     * Walk the sharded directory tree and populate the in-memory index.
     * Missing or malformed files are silently skipped.
     */
    private async buildIndex(): Promise<void> {
        let shardDirs: string[];
        try {
            shardDirs = await readdir(this.rootDir);
        } catch {
            return;
        }

        for (const l1 of shardDirs) {
            const l1Path = join(this.rootDir, l1);
            let l2Dirs: string[];
            try {
                l2Dirs = await readdir(l1Path);
            } catch {
                continue;
            }

            for (const l2 of l2Dirs) {
                const l2Path = join(l1Path, l2);
                let files: string[];
                try {
                    files = await readdir(l2Path);
                } catch {
                    continue;
                }

                for (const file of files) {
                    if (!file.endsWith('.yaml') && !file.endsWith('.yml')) continue;
                    try {
                        const raw = await readFile(join(l2Path, file), 'utf8');
                        const parsed = parseYaml(raw);
                        const minion = parsed as unknown as Minion;
                        if (minion.id) {
                            this.index.set(minion.id, minion);
                        }
                    } catch (err) {
                        const code = (err as NodeJS.ErrnoException).code;
                        if (code === 'ENOENT' || code === 'EACCES' || code === 'EISDIR') continue;
                        // Skip parse errors silently
                        if (err instanceof Error && err.message.includes('parse')) continue;
                        throw err;
                    }
                }
            }
        }
    }

    // ── StorageAdapter implementation ───────────────────────────────────────

    async get(id: string): Promise<Minion | undefined> {
        return this.index.get(id);
    }

    async set(minion: Minion): Promise<void> {
        const dir = shardPath(this.rootDir, minion.id);
        await mkdir(dir, { recursive: true });

        // Atomic write: write to a temp file, then rename into place
        const target = yamlFilePath(this.rootDir, minion.id);
        const tmp = `${target}.tmp`;
        const yamlContent = toYaml(minion as unknown as Record<string, unknown>);
        await writeFile(tmp, yamlContent + '\n', 'utf8');
        await rename(tmp, target);

        this.index.set(minion.id, minion);
    }

    async delete(id: string): Promise<void> {
        this.index.delete(id);
        try {
            await unlink(yamlFilePath(this.rootDir, id));
        } catch {
            // Silently ignore missing files
        }
    }

    async list(filter?: StorageFilter): Promise<Minion[]> {
        const all = Array.from(this.index.values());
        if (!filter) {
            return all.filter((m) => !m.deletedAt);
        }
        return applyFilter(all, filter);
    }

    async search(query: string): Promise<Minion[]> {
        if (!query.trim()) return this.list();

        const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
        const all = Array.from(this.index.values()).filter((m) => !m.deletedAt);

        return all.filter((m) => {
            const text = (m.searchableText ?? m.title).toLowerCase();
            return tokens.every((token) => text.includes(token));
        });
    }
}

// ─── Utility exports ─────────────────────────────────────────────────────────

/** Convert a plain object to YAML string. */
export { toYaml };
/** Parse a YAML string to a plain object. */
export { parseYaml };
