[**minions-core v0.1.0**](../README.md)

***

[minions-core](../README.md) / validateFields

# Function: validateFields()

> **validateFields**(`fields`, `schema`): [`ValidationResult`](../interfaces/ValidationResult.md)

Defined in: [validation/index.ts:180](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/validation/index.ts#L180)

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
