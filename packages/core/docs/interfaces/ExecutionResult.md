[**@minions/core v0.1.0**](../README.md)

***

[@minions/core](../README.md) / ExecutionResult

# Interface: ExecutionResult

Defined in: [types/index.ts:222](https://github.com/mxn2020/minions/blob/bcb753ef3e7bd81eeb88732a5f9b118c055a4278/packages/core/src/types/index.ts#L222)

Result of executing a minion.

## Properties

### output

> **output**: `unknown`

Defined in: [types/index.ts:223](https://github.com/mxn2020/minions/blob/bcb753ef3e7bd81eeb88732a5f9b118c055a4278/packages/core/src/types/index.ts#L223)

***

### status

> **status**: `"completed"` \| `"cancelled"` \| `"failed"`

Defined in: [types/index.ts:224](https://github.com/mxn2020/minions/blob/bcb753ef3e7bd81eeb88732a5f9b118c055a4278/packages/core/src/types/index.ts#L224)

***

### startedAt

> **startedAt**: `string`

Defined in: [types/index.ts:225](https://github.com/mxn2020/minions/blob/bcb753ef3e7bd81eeb88732a5f9b118c055a4278/packages/core/src/types/index.ts#L225)

***

### completedAt

> **completedAt**: `string`

Defined in: [types/index.ts:226](https://github.com/mxn2020/minions/blob/bcb753ef3e7bd81eeb88732a5f9b118c055a4278/packages/core/src/types/index.ts#L226)

***

### error?

> `optional` **error**: `string`

Defined in: [types/index.ts:227](https://github.com/mxn2020/minions/blob/bcb753ef3e7bd81eeb88732a5f9b118c055a4278/packages/core/src/types/index.ts#L227)

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [types/index.ts:228](https://github.com/mxn2020/minions/blob/bcb753ef3e7bd81eeb88732a5f9b118c055a4278/packages/core/src/types/index.ts#L228)
