# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-19

### Added
- **Core library** (`minions-core`): Typed minions, validation, relations, lifecycle, schema evolution
- **CLI** (`minions-cli`): Project scaffolding, type management, file validation
- **Web app** (`minions-web`): Landing page with interactive playground
- **Docs** (`minions-docs`): Starlight documentation site with guides and API reference
- **Specification** v0.1: Three primitives (Minion, MinionType, Relation), 12 field types, 12 relation types
- 4 built-in types: Note, Link, File, Contact
- 4 layer types: Agent, Team, Thought, Task
- Schema evolution with `_legacy` field preservation
- Progressive complexity model (flat → nested via relations)

### Fixed
- `SPEC_VERSION` no longer uses `createRequire` (browser-compatible)
- Stricter date validation (ISO 8601 regex, rejects `Date.parse` leniency)
- Stricter URL validation (`new URL()` constructor, rejects empty hosts and non-http protocols)
- `computeSearchableText` now includes `description` field
- `createMinion` errors surfaced in UI (was silent `console.error`)
- All GitHub/npm placeholder links replaced with real URLs
- CLI `tsconfig.json` now uses `module`/`moduleResolution: Node16` (was inheriting `bundler` from root)
- Astro 5 content config moved to `src/content.config.ts` (was at old `src/content/config.ts` location)
- Root `pnpm test` now filters to `minions-core` only (avoids failures from packages without test scripts)
- Spec date validation wording updated to match ISO 8601 implementation

### Changed
- Playground type resolution now always uses the selected type tab (removed `minionTypeId` fallback from editor JSON)
- Removed redundant `tailwind.config.ts` (Tailwind v4 `@theme` in CSS is canonical)
- Added `vitest.config.ts` to `packages/core` with explicit include pattern
- Added npm metadata (`repository`, `homepage`, `keywords`) to `minions-core` and `minions-cli`
- Added `engines: { node: ">=18" }` to `minions-cli` and `minions-web`
- Added 404 page to `minions-web`
