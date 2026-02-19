[**@minions/core v0.1.0**](../README.md)

***

[@minions/core](../README.md) / softDelete

# Function: softDelete()

> **softDelete**(`minion`, `deletedBy?`): [`Minion`](../interfaces/Minion.md)

Defined in: [lifecycle/index.ts:139](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/lifecycle/index.ts#L139)

Soft-delete a minion by setting deletedAt/deletedBy.

## Parameters

### minion

[`Minion`](../interfaces/Minion.md)

The minion to soft-delete

### deletedBy?

`string`

Optional identifier of who deleted it

## Returns

[`Minion`](../interfaces/Minion.md)

The soft-deleted minion
