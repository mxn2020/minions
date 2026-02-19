[**@minions/core v0.1.0**](../README.md)

***

[@minions/core](../README.md) / validateField

# Function: validateField()

> **validateField**(`value`, `field`): [`ValidationError`](../interfaces/ValidationError.md)[]

Defined in: [validation/index.ts:18](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/validation/index.ts#L18)

Validate a single field value against its definition.

## Parameters

### value

`unknown`

The value to validate

### field

[`FieldDefinition`](../interfaces/FieldDefinition.md)

The field definition to validate against

## Returns

[`ValidationError`](../interfaces/ValidationError.md)[]

Array of validation errors (empty if valid)
