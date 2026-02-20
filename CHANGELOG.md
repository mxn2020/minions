# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.3] - 2026-02-20

### Changed
- **Storage: shared `applyFilter` utility** — extracted duplicated filtering logic from `MemoryStorageAdapter` and `JsonFileStorageAdapter` into `filterUtils` (TypeScript) / `filter_utils` (Python)
- **Storage: `sortBy` / `sortOrder` on `StorageFilter`** — allows sorting by `createdAt`, `updatedAt`, or `title` in ascending or descending order
- **Storage: atomic writes** — `JsonFileStorageAdapter` now writes to a `.tmp` file then renames into place, preventing partial-write corruption on crash
- **Storage: search case-sensitivity fix** — search fallback now always lowercases the title before matching
- **Python: `asyncio.get_running_loop()`** — replaced deprecated `asyncio.get_event_loop()` for Python 3.12+ compatibility
- **Client: `requireStorage()` guard** — replaced 5 inline `if (!this.storage)` checks with a single DRY helper (TypeScript), matching the existing Python pattern

## [0.2.2] - 2026-02-20

### Added
- **Modular storage abstraction layer** for TypeScript and Python SDKs
  - `StorageAdapter` interface / ABC — pluggable contract for all storage backends
  - `MemoryStorageAdapter` — in-memory `Map`/`dict` storage for testing and ephemeral workloads
  - `JsonFileStorageAdapter` — disk-based JSON persistence with sharded `ab/cd/uuid.json` directory layout and in-memory index
  - `StorageFilter` — filtering by type, status, tags, soft-delete inclusion, limit/offset pagination
  - Full-text search via pre-computed `searchableText` field
- **`Minions` client storage integration** — `save()`, `load()`, `remove()`, `listMinions()`, `searchMinions()` methods
- 32 new TypeScript tests and 35 new Python tests covering all adapter contracts and client integration

## [0.2.1] - 2026-02-20

### Added
- **Unified Client Architecture**: Central client `Minions` orchestrating `TypeRegistry` and `RelationGraph`. Added `MinionPlugin` interface to support plugin mounting.

## [0.2.0] - 2026-02-19

### Added
- **Python SDK** (`minions-sdk` on PyPI): Complete Python port mirroring the TypeScript core — zero dependencies, Python 3.11+
  - All 8 modules: types, validation, schemas, registry, relations, lifecycle, evolution
  - 150 pytest tests covering all functionality plus JSON serialization round-trips
  - Cross-SDK interop via `to_dict()` / `from_dict()` (camelCase ↔ snake_case)
  - CI runs Python 3.11, 3.12, 3.13
- **Dual-SDK documentation**: All doc pages updated with TypeScript/Python tabs
  - Quickstart, primitives, lifecycle, evolution, API reference, tutorial — full tab treatment
  - Conformance, contributing — partial tabs
  - All 10 built-in type pages — usage example tabs
  - API reference includes "Key Differences" table between SDKs
- **Copy to Markdown** button on docs site (fetches raw source from GitHub)
- PyPI publishing in GitHub Actions `publish.yml`

### Changed
- Documentation files migrated from `.md` to `.mdx` (required for Starlight Tabs component)
- CHANGELOG updated with 0.2.0 release

## [0.1.0] - 2026-02-19

### Added
- **Core library** (`minions-sdk`): Typed minions, validation, relations, lifecycle, schema evolution
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
- Root `pnpm test` now filters to `minions-sdk` only (avoids failures from packages without test scripts)
- Spec date validation wording updated to match ISO 8601 implementation

### Changed
- Playground type resolution now always uses the selected type tab (removed `minionTypeId` fallback from editor JSON)
- Removed redundant `tailwind.config.ts` (Tailwind v4 `@theme` in CSS is canonical)
- Added `vitest.config.ts` to `packages/core` with explicit include pattern
- Added npm metadata (`repository`, `homepage`, `keywords`) to `minions-sdk` and `minions-cli`
- Added `engines: { node: ">=18" }` to `minions-cli` and `minions-web`
- Added 404 page to `minions-web`

