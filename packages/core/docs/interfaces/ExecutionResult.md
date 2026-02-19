[**@minions/core v0.1.0**](../README.md)

***

[@minions/core](../README.md) / ExecutionResult

# Interface: ExecutionResult

Defined in: [types/index.ts:223](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L223)

Result of executing a minion.

## Properties

### output

> **output**: `unknown`

Defined in: [types/index.ts:224](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L224)

***

### status

> **status**: `"completed"` \| `"cancelled"` \| `"failed"`

Defined in: [types/index.ts:225](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L225)

***

### startedAt

> **startedAt**: `string`

Defined in: [types/index.ts:226](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L226)

***

### completedAt

> **completedAt**: `string`

Defined in: [types/index.ts:227](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L227)

***

### error?

> `optional` **error**: `string`

Defined in: [types/index.ts:228](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L228)

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [types/index.ts:229](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L229)
