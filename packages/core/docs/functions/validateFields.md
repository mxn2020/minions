[**@minions/core v0.1.0**](../README.md)

***

[@minions/core](../README.md) / validateFields

# Function: validateFields()

> **validateFields**(`fields`, `schema`): [`ValidationResult`](../interfaces/ValidationResult.md)

Defined in: [validation/index.ts:171](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/validation/index.ts#L171)

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
