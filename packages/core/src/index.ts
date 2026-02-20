/**
 * @module minions-sdk
 * Framework-agnostic core library for the Minions structured object system.
 *
 * @example
 * ```typescript
 * import { TypeRegistry, createMinion, RelationGraph } from 'minions-sdk';
 *
 * const registry = new TypeRegistry();
 * const agentType = registry.getBySlug('agent')!;
 *
 * const { minion, validation } = createMinion({
 *   title: 'Research Assistant',
 *   fields: {
 *     role: 'researcher',
 *     model: 'gpt-4',
 *     systemPrompt: 'You are a research assistant.',
 *     tools: ['web-search', 'summarize'],
 *   },
 * }, agentType);
 * ```
 */

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  FieldType,
  FieldValidation,
  FieldDefinition,
  RelationType,
  MinionStatus,
  MinionPriority,
  Minion,
  MinionType,
  Relation,
  CreateMinionInput,
  UpdateMinionInput,
  CreateRelationInput,
  ExecutionResult,
  Executable,
  ValidationError,
  ValidationResult,
} from './types/index.js';

// ─── Validation ──────────────────────────────────────────────────────────────
export { validateField, validateFields } from './validation/index.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────
export {
  noteType,
  linkType,
  fileType,
  contactType,
  agentType,
  teamType,
  thoughtType,
  promptTemplateType,
  testCaseType,
  taskType,
  builtinTypes,
} from './schemas/index.js';

// ─── Registry ────────────────────────────────────────────────────────────────
export { TypeRegistry } from './registry/index.js';

// ─── Relations ───────────────────────────────────────────────────────────────
export { RelationGraph } from './relations/index.js';

// ─── Lifecycle ───────────────────────────────────────────────────────────────
export { createMinion, updateMinion, softDelete, hardDelete, restoreMinion, applyDefaults } from './lifecycle/index.js';

// ─── Evolution ───────────────────────────────────────────────────────────────
export { migrateMinion } from './evolution/index.js';

// ─── Utilities ───────────────────────────────────────────────────────────────
export { generateId, now } from './utils.js';

// ─── Client ──────────────────────────────────────────────────────────────────
export { Minions, MinionWrapper, type MinionsConfig, type MinionPlugin } from './client/index.js';

// ─── Storage ─────────────────────────────────────────────────────────────────
export type { StorageAdapter, StorageFilter } from './storage/index.js';
export { MemoryStorageAdapter, applyFilter } from './storage/index.js';

/**
 * Current specification version — auto-generated from package.json
 * by `scripts/gen-version.js` during prebuild. Do not edit manually.
 */
export { SPEC_VERSION } from './version.js';
