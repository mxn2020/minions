[**@minions/core v0.1.0**](../README.md)

***

[@minions/core](../README.md) / CreateMinionInput

# Interface: CreateMinionInput

Defined in: [types/index.ts:183](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L183)

Input for creating a new Minion. `id` and timestamps are generated automatically. Pass the `MinionType` to `createMinion` — it determines the type.

## Properties

### title

> **title**: `string`

Defined in: [types/index.ts:184](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L184)

***

### fields?

> `optional` **fields**: `Record`\<`string`, `unknown`\>

Defined in: [types/index.ts:185](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L185)

***

### tags?

> `optional` **tags**: `string`[]

Defined in: [types/index.ts:186](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L186)

***

### status?

> `optional` **status**: [`MinionStatus`](../type-aliases/MinionStatus.md)

Defined in: [types/index.ts:187](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L187)

***

### priority?

> `optional` **priority**: [`MinionPriority`](../type-aliases/MinionPriority.md)

Defined in: [types/index.ts:188](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L188)

***

### description?

> `optional` **description**: `string`

Defined in: [types/index.ts:189](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L189)

***

### dueDate?

> `optional` **dueDate**: `string`

Defined in: [types/index.ts:190](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L190)

***

### categoryId?

> `optional` **categoryId**: `string`

Defined in: [types/index.ts:191](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L191)

***

### folderId?

> `optional` **folderId**: `string`

Defined in: [types/index.ts:192](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L192)

***

### createdBy?

> `optional` **createdBy**: `string`

Defined in: [types/index.ts:193](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L193)
