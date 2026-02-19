[**@minions/core v0.1.0**](../README.md)

***

[@minions/core](../README.md) / createMinion

# Function: createMinion()

> **createMinion**(`input`, `type`): `object`

Defined in: [lifecycle/index.ts:67](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/lifecycle/index.ts#L67)

Create a new Minion instance from input, generating id and timestamps.
Validates fields against the provided MinionType schema.

## Parameters

### input

[`CreateMinionInput`](../interfaces/CreateMinionInput.md)

The creation input

### type

[`MinionType`](../interfaces/MinionType.md)

The MinionType to validate against

## Returns

`object`

An object with the created minion and any validation result

### minion

> **minion**: [`Minion`](../interfaces/Minion.md)

### validation

> **validation**: [`ValidationResult`](../interfaces/ValidationResult.md)
