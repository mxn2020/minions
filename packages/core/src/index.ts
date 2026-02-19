/**
 * @module @minions/core
 * Framework-agnostic core library for the Minions structured object system.
 *
 * @example
 * ```typescript
 * import { TypeRegistry, createMinion, RelationGraph } from '@minions/core';
 *
 * const registry = new TypeRegistry();
 * const agentType = registry.getBySlug('agent')!;
 *
 * const { minion, validation } = createMinion({
 *   title: 'Research Assistant',
 *   minionTypeId: agentType.id,
 *   fields: {
 *     role: 'researcher',
 *     model: 'gpt-4',
 *     systemPrompt: 'You are a research assistant.',
 *     tools: ['web-search', 'summarize'],
 *   },
 * }, agentType);
 * ```
 */

import { createRequire } from 'node:module';

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
export { createMinion, updateMinion, softDelete, hardDelete, restoreMinion } from './lifecycle/index.js';

// ─── Evolution ───────────────────────────────────────────────────────────────
export { migrateMinion } from './evolution/index.js';

// ─── Utilities ───────────────────────────────────────────────────────────────
export { generateId, now } from './utils.js';

/** Current specification version — derived from package.json at runtime. */
const _require = createRequire(import.meta.url);
const _pkg = _require('../package.json') as { version: string };
export const SPEC_VERSION: string = _pkg.version;
