[**minions-core v0.1.0**](../README.md)

***

[minions-core](../README.md) / RelationGraph

# Class: RelationGraph

Defined in: [relations/index.ts:13](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/relations/index.ts#L13)

In-memory relation graph manager.
Provides utilities to add, remove, query, and traverse relations.

## Constructors

### Constructor

> **new RelationGraph**(): `RelationGraph`

#### Returns

`RelationGraph`

## Methods

### add()

> **add**(`input`): [`Relation`](../interfaces/Relation.md)

Defined in: [relations/index.ts:20](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/relations/index.ts#L20)

Add a relation to the graph.

#### Parameters

##### input

[`CreateRelationInput`](../interfaces/CreateRelationInput.md)

#### Returns

[`Relation`](../interfaces/Relation.md)

The created Relation.

***

### remove()

> **remove**(`id`): `boolean`

Defined in: [relations/index.ts:38](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/relations/index.ts#L38)

Remove a relation by ID.

#### Parameters

##### id

`string`

#### Returns

`boolean`

true if the relation was removed.

***

### removeByMinionId()

> **removeByMinionId**(`minionId`): `number`

Defined in: [relations/index.ts:46](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/relations/index.ts#L46)

Remove all relations involving a given minion (as source or target).

#### Parameters

##### minionId

`string`

#### Returns

`number`

Number of relations removed.

***

### get()

> **get**(`id`): [`Relation`](../interfaces/Relation.md) \| `undefined`

Defined in: [relations/index.ts:60](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/relations/index.ts#L60)

Get a relation by ID.

#### Parameters

##### id

`string`

#### Returns

[`Relation`](../interfaces/Relation.md) \| `undefined`

***

### list()

> **list**(): [`Relation`](../interfaces/Relation.md)[]

Defined in: [relations/index.ts:67](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/relations/index.ts#L67)

Get all relations.

#### Returns

[`Relation`](../interfaces/Relation.md)[]

***

### getFromSource()

> **getFromSource**(`sourceId`, `type?`): [`Relation`](../interfaces/Relation.md)[]

Defined in: [relations/index.ts:74](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/relations/index.ts#L74)

Get all relations where the given minion is the source.

#### Parameters

##### sourceId

`string`

##### type?

[`RelationType`](../type-aliases/RelationType.md)

#### Returns

[`Relation`](../interfaces/Relation.md)[]

***

### getToTarget()

> **getToTarget**(`targetId`, `type?`): [`Relation`](../interfaces/Relation.md)[]

Defined in: [relations/index.ts:83](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/relations/index.ts#L83)

Get all relations where the given minion is the target.

#### Parameters

##### targetId

`string`

##### type?

[`RelationType`](../type-aliases/RelationType.md)

#### Returns

[`Relation`](../interfaces/Relation.md)[]

***

### getChildren()

> **getChildren**(`parentId`): `string`[]

Defined in: [relations/index.ts:92](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/relations/index.ts#L92)

Get children of a minion (targets of parent_of relations from this minion).

#### Parameters

##### parentId

`string`

#### Returns

`string`[]

***

### getParents()

> **getParents**(`childId`): `string`[]

Defined in: [relations/index.ts:99](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/relations/index.ts#L99)

Get parents of a minion (sources of parent_of relations to this minion).

#### Parameters

##### childId

`string`

#### Returns

`string`[]

***

### getTree()

> **getTree**(`rootId`): `string`[]

Defined in: [relations/index.ts:107](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/relations/index.ts#L107)

Get the full tree of descendants from a root minion using parent_of relations.
Returns a flat array of all descendant IDs (depth-first).

#### Parameters

##### rootId

`string`

#### Returns

`string`[]

***

### getNetwork()

> **getNetwork**(`minionId`): `string`[]

Defined in: [relations/index.ts:128](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/relations/index.ts#L128)

Get all minions connected to the given minion (regardless of direction or type).
Returns a flat array of connected minion IDs.

#### Parameters

##### minionId

`string`

#### Returns

`string`[]
