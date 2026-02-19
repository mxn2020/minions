[**@minions/core v0.1.0**](../README.md)

***

[@minions/core](../README.md) / softDelete

# Function: softDelete()

> **softDelete**(`minion`, `deletedBy?`): [`Minion`](../interfaces/Minion.md)

Defined in: [lifecycle/index.ts:143](https://github.com/mxn2020/minions/blob/bcb753ef3e7bd81eeb88732a5f9b118c055a4278/packages/core/src/lifecycle/index.ts#L143)

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
