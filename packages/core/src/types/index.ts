/**
 * @module @minions/core/types
 * Core type definitions for the Minions structured object system.
 */

// ─── Field Types ─────────────────────────────────────────────────────────────

/** All supported field types in the Minions system. */
export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'select'
  | 'multi-select'
  | 'url'
  | 'email'
  | 'textarea'
  | 'tags'
  | 'json'
  | 'array';

/** Validation constraints for a field. */
export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

/** Definition of a single field within a MinionType schema. */
export interface FieldDefinition {
  /** Field key used in the minion's `fields` object. */
  name: string;
  /** The data type of this field. */
  type: FieldType;
  /** Human-readable display label. */
  label?: string;
  /** Description of the field's purpose. */
  description?: string;
  /** Whether this field is required. Defaults to false. */
  required?: boolean;
  /** Default value if none is provided. */
  defaultValue?: unknown;
  /** Options for select and multi-select fields. */
  options?: string[];
  /** Additional validation constraints. */
  validation?: FieldValidation;
}

// ─── Relation Types ──────────────────────────────────────────────────────────

/** All supported relation types between minions. */
export type RelationType =
  | 'parent_of'
  | 'depends_on'
  | 'implements'
  | 'relates_to'
  | 'inspired_by'
  | 'triggers'
  | 'references'
  | 'blocks'
  | 'alternative_to'
  | 'part_of'
  | 'follows'
  | 'integration_link';

// ─── Status & Priority ──────────────────────────────────────────────────────

/** Lifecycle status of a minion. */
export type MinionStatus = 'active' | 'todo' | 'in_progress' | 'completed' | 'cancelled';

/** Priority level of a minion. */
export type MinionPriority = 'low' | 'medium' | 'high' | 'urgent';

// ─── Core Primitives ─────────────────────────────────────────────────────────

/**
 * A Minion is a structured object instance — the fundamental unit of the system.
 * Every minion is an instance of a MinionType and stores its dynamic data in `fields`.
 */
export interface Minion {
  /** Unique identifier (UUID v4). */
  id: string;
  /** Human-readable title. */
  title: string;
  /** Reference to the MinionType that defines this minion's schema. */
  minionTypeId: string;
  /** Dynamic field values as defined by the MinionType schema. */
  fields: Record<string, unknown>;
  /** ISO 8601 creation timestamp. */
  createdAt: string;
  /** ISO 8601 last-update timestamp. */
  updatedAt: string;
  /** Freeform tags for categorization. */
  tags?: string[];
  /** Current lifecycle status. */
  status?: MinionStatus;
  /** Priority level. */
  priority?: MinionPriority;
  /** Longer description of this minion. */
  description?: string;
  /** ISO 8601 due date. */
  dueDate?: string;
  /** Reference to a category minion. */
  categoryId?: string;
  /** Reference to a folder/container minion. */
  folderId?: string;
  /** User or system that created this minion. */
  createdBy?: string;
  /** User or system that last updated this minion. */
  updatedBy?: string;
  /** ISO 8601 soft-delete timestamp. Null/undefined if not deleted. */
  deletedAt?: string | null;
  /** User or system that deleted this minion. */
  deletedBy?: string | null;
  /** Computed full-text search field. */
  searchableText?: string;
  /** Legacy field values preserved after schema evolution. */
  _legacy?: Record<string, unknown>;
}

/**
 * A MinionType defines the schema and behavior of a kind of minion.
 */
export interface MinionType {
  /** Unique identifier (UUID v4). */
  id: string;
  /** Human-readable name. */
  name: string;
  /** URL-safe kebab-case slug, unique within the system. */
  slug: string;
  /** JSON Schema-style field definitions. */
  schema: FieldDefinition[];
  /** Description of this type's purpose. */
  description?: string;
  /** Emoji or icon identifier. */
  icon?: string;
  /** Hex color code. */
  color?: string;
  /** Whether this is a built-in system type. */
  isSystem?: boolean;
  /** Whether this type represents an organizational container. */
  isOrganizational?: boolean;
  /** Type IDs that are allowed as children via parent_of relations. */
  allowedChildTypes?: string[];
  /** Named behavior flags (e.g. "executable", "cacheable"). */
  behaviors?: string[];
  /** Default view mode. */
  defaultView?: string;
  /** All available view modes. */
  availableViews?: string[];
  /** ISO 8601 creation timestamp. */
  createdAt?: string;
  /** ISO 8601 last-update timestamp. */
  updatedAt?: string;
}

/**
 * A Relation is a typed, directional link between two minions.
 */
export interface Relation {
  /** Unique identifier (UUID v4). */
  id: string;
  /** The minion ID that is the source/origin of the relation. */
  sourceId: string;
  /** The minion ID that is the target/destination of the relation. */
  targetId: string;
  /** The semantic type of this relation. */
  type: RelationType;
  /** ISO 8601 creation timestamp. */
  createdAt: string;
  /** Optional arbitrary metadata about this relation. */
  metadata?: unknown;
  /** User or system that created this relation. */
  createdBy?: string;
}

// ─── Input Types (for creation) ──────────────────────────────────────────────

/** Input for creating a new Minion (id and timestamps are generated). */
export interface CreateMinionInput {
  title: string;
  minionTypeId: string;
  fields?: Record<string, unknown>;
  tags?: string[];
  status?: MinionStatus;
  priority?: MinionPriority;
  description?: string;
  dueDate?: string;
  categoryId?: string;
  folderId?: string;
  createdBy?: string;
}

/** Input for updating an existing Minion. */
export interface UpdateMinionInput {
  title?: string;
  fields?: Record<string, unknown>;
  tags?: string[];
  status?: MinionStatus;
  priority?: MinionPriority;
  description?: string;
  dueDate?: string;
  categoryId?: string;
  folderId?: string;
  updatedBy?: string;
}

/** Input for creating a new Relation. */
export interface CreateRelationInput {
  sourceId: string;
  targetId: string;
  type: RelationType;
  metadata?: unknown;
  createdBy?: string;
}

// ─── Execution Contract ──────────────────────────────────────────────────────

/** Result of executing a minion. */
export interface ExecutionResult {
  output: unknown;
  status: 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

/** Interface that executable minions must satisfy. */
export interface Executable {
  execute(input: Record<string, unknown>): Promise<ExecutionResult>;
}

// ─── Validation ──────────────────────────────────────────────────────────────

/** A single validation error. */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/** Result of validating a minion against its type schema. */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
