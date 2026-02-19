[**@minions/core v0.1.0**](../README.md)

***

[@minions/core](../README.md) / createMinion

# Function: createMinion()

> **createMinion**(`input`, `type`): `object`

Defined in: [lifecycle/index.ts:71](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/lifecycle/index.ts#L71)

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
