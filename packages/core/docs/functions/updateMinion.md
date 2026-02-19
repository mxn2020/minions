[**@minions/core v0.1.0**](../README.md)

***

[@minions/core](../README.md) / updateMinion

# Function: updateMinion()

> **updateMinion**(`minion`, `input`, `type`): `object`

Defined in: [lifecycle/index.ts:109](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/lifecycle/index.ts#L109)

Update an existing Minion with new values.
Validates updated fields against the provided MinionType schema.

## Parameters

### minion

[`Minion`](../interfaces/Minion.md)

The existing minion

### input

[`UpdateMinionInput`](../interfaces/UpdateMinionInput.md)

The update input

### type

[`MinionType`](../interfaces/MinionType.md)

The MinionType to validate against

## Returns

`object`

An object with the updated minion and any validation result

### minion

> **minion**: [`Minion`](../interfaces/Minion.md)

### validation

> **validation**: [`ValidationResult`](../interfaces/ValidationResult.md)
