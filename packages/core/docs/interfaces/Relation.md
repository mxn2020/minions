[**@minions/core v0.1.0**](../README.md)

***

[@minions/core](../README.md) / Relation

# Interface: Relation

Defined in: [types/index.ts:163](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L163)

A Relation is a typed, directional link between two minions.

## Properties

### id

> **id**: `string`

Defined in: [types/index.ts:165](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L165)

Unique identifier (UUID v4).

***

### sourceId

> **sourceId**: `string`

Defined in: [types/index.ts:167](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L167)

The minion ID that is the source/origin of the relation.

***

### targetId

> **targetId**: `string`

Defined in: [types/index.ts:169](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L169)

The minion ID that is the target/destination of the relation.

***

### type

> **type**: [`RelationType`](../type-aliases/RelationType.md)

Defined in: [types/index.ts:171](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L171)

The semantic type of this relation.

***

### createdAt

> **createdAt**: `string`

Defined in: [types/index.ts:173](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L173)

ISO 8601 creation timestamp.

***

### metadata?

> `optional` **metadata**: `unknown`

Defined in: [types/index.ts:175](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L175)

Optional arbitrary metadata about this relation.

***

### createdBy?

> `optional` **createdBy**: `string`

Defined in: [types/index.ts:177](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/types/index.ts#L177)

User or system that created this relation.
