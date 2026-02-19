# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-19

### Added
- **Core library** (`@minions/core`): Typed minions, validation, relations, lifecycle, schema evolution
- **CLI** (`@minions/cli`): Project scaffolding, type management, file validation
- **Web app** (`@minions/web`): Landing page with interactive playground
- **Docs** (`@minions/docs`): Starlight documentation site with guides and API reference
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
- Playground validates against `json.minionTypeId`, not the selected tab type
- `createMinion` errors surfaced in UI (was silent `console.error`)
- All GitHub/npm placeholder links replaced with real URLs
- Conformance page dead link to spec fixed
