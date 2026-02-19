[**@minions/core v0.1.0**](../README.md)

***

[@minions/core](../README.md) / updateMinion

# Function: updateMinion()

> **updateMinion**(`minion`, `input`, `type`): `object`

Defined in: [lifecycle/index.ts:105](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/lifecycle/index.ts#L105)

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
