[**@minions/core v0.1.0**](../README.md)

***

[@minions/core](../README.md) / hardDelete

# Function: hardDelete()

> **hardDelete**(`minion`, `graph`): `void`

Defined in: [lifecycle/index.ts:159](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/lifecycle/index.ts#L159)

Hard-delete a minion by removing all of its relations from the graph.

**Important:** This function only cleans up the relation graph. The caller
is responsible for removing the minion object itself from whatever storage
layer is in use (array, database, etc.).

## Parameters

### minion

[`Minion`](../interfaces/Minion.md)

The minion to hard-delete

### graph

[`RelationGraph`](../classes/RelationGraph.md)

The RelationGraph to clean up

## Returns

`void`
