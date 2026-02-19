[**@minions/core v0.1.0**](../README.md)

***

[@minions/core](../README.md) / softDelete

# Function: softDelete()

> **softDelete**(`minion`, `deletedBy?`): [`Minion`](../interfaces/Minion.md)

Defined in: [lifecycle/index.ts:143](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/lifecycle/index.ts#L143)

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
