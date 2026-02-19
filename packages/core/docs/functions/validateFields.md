[**@minions/core v0.1.0**](../README.md)

***

[@minions/core](../README.md) / validateFields

# Function: validateFields()

> **validateFields**(`fields`, `schema`): [`ValidationResult`](../interfaces/ValidationResult.md)

Defined in: [validation/index.ts:180](https://github.com/mxn2020/minions/blob/bcb753ef3e7bd81eeb88732a5f9b118c055a4278/packages/core/src/validation/index.ts#L180)

Validate all fields of a minion against a MinionType schema.

## Parameters

### fields

`Record`\<`string`, `unknown`\>

The minion's field values

### schema

[`FieldDefinition`](../interfaces/FieldDefinition.md)[]

The field definitions from the MinionType

## Returns

[`ValidationResult`](../interfaces/ValidationResult.md)

Validation result with any errors
