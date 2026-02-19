/**
 * Tests for top-level package exports and metadata.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { SPEC_VERSION } from '../index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));

describe('SPEC_VERSION', () => {
    it('must match the version field in package.json to prevent drift', () => {
        expect(SPEC_VERSION).toBe(pkg.version);
    });

    it('should be a valid semver string', () => {
        expect(SPEC_VERSION).toMatch(/^\d+\.\d+\.\d+/);
    });
});
