[**minions-sdk v0.1.0**](../README.md)

***

[minions-sdk](../README.md) / Minion

# Interface: Minion

Defined in: [types/index.ts:83](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L83)

A Minion is a structured object instance — the fundamental unit of the system.
Every minion is an instance of a MinionType and stores its dynamic data in `fields`.

## Properties

### id

> **id**: `string`

Defined in: [types/index.ts:85](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L85)

Unique identifier (UUID v4).

***

### title

> **title**: `string`

Defined in: [types/index.ts:87](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L87)

Human-readable title.

***

### minionTypeId

> **minionTypeId**: `string`

Defined in: [types/index.ts:89](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L89)

Reference to the MinionType that defines this minion's schema.

***

### fields

> **fields**: `Record`\<`string`, `unknown`\>

Defined in: [types/index.ts:91](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L91)

Dynamic field values as defined by the MinionType schema.

***

### createdAt

> **createdAt**: `string`

Defined in: [types/index.ts:93](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L93)

ISO 8601 creation timestamp.

***

### updatedAt

> **updatedAt**: `string`

Defined in: [types/index.ts:95](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L95)

ISO 8601 last-update timestamp.

***

### tags?

> `optional` **tags**: `string`[]

Defined in: [types/index.ts:97](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L97)

Freeform tags for categorization.

***

### status?

> `optional` **status**: [`MinionStatus`](../type-aliases/MinionStatus.md)

Defined in: [types/index.ts:99](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L99)

Current lifecycle status.

***

### priority?

> `optional` **priority**: [`MinionPriority`](../type-aliases/MinionPriority.md)

Defined in: [types/index.ts:101](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L101)

Priority level.

***

### description?

> `optional` **description**: `string`

Defined in: [types/index.ts:103](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L103)

Longer description of this minion.

***

### dueDate?

> `optional` **dueDate**: `string`

Defined in: [types/index.ts:105](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L105)

ISO 8601 due date.

***

### categoryId?

> `optional` **categoryId**: `string`

Defined in: [types/index.ts:107](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L107)

Reference to a category minion.

***

### folderId?

> `optional` **folderId**: `string`

Defined in: [types/index.ts:109](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L109)

Reference to a folder/container minion.

***

### createdBy?

> `optional` **createdBy**: `string`

Defined in: [types/index.ts:111](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L111)

User or system that created this minion.

***

### updatedBy?

> `optional` **updatedBy**: `string`

Defined in: [types/index.ts:113](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L113)

User or system that last updated this minion.

***

### deletedAt?

> `optional` **deletedAt**: `string` \| `null`

Defined in: [types/index.ts:115](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L115)

ISO 8601 soft-delete timestamp. Null/undefined if not deleted.

***

### deletedBy?

> `optional` **deletedBy**: `string` \| `null`

Defined in: [types/index.ts:117](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L117)

User or system that deleted this minion.

***

### searchableText?

> `optional` **searchableText**: `string`

Defined in: [types/index.ts:119](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L119)

Computed full-text search field.

***

### \_legacy?

> `optional` **\_legacy**: `Record`\<`string`, `unknown`\>

Defined in: [types/index.ts:121](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L121)

Legacy field values preserved after schema evolution.
