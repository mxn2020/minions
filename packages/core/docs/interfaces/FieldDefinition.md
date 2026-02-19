[**@minions/core v0.1.0**](../README.md)

***

[@minions/core](../README.md) / FieldDefinition

# Interface: FieldDefinition

Defined in: [types/index.ts:33](https://github.com/mxn2020/minions/blob/bcb753ef3e7bd81eeb88732a5f9b118c055a4278/packages/core/src/types/index.ts#L33)

Definition of a single field within a MinionType schema.

## Properties

### name

> **name**: `string`

Defined in: [types/index.ts:35](https://github.com/mxn2020/minions/blob/bcb753ef3e7bd81eeb88732a5f9b118c055a4278/packages/core/src/types/index.ts#L35)

Field key used in the minion's `fields` object.

***

### type

> **type**: [`FieldType`](../type-aliases/FieldType.md)

Defined in: [types/index.ts:37](https://github.com/mxn2020/minions/blob/bcb753ef3e7bd81eeb88732a5f9b118c055a4278/packages/core/src/types/index.ts#L37)

The data type of this field.

***

### label?

> `optional` **label**: `string`

Defined in: [types/index.ts:39](https://github.com/mxn2020/minions/blob/bcb753ef3e7bd81eeb88732a5f9b118c055a4278/packages/core/src/types/index.ts#L39)

Human-readable display label.

***

### description?

> `optional` **description**: `string`

Defined in: [types/index.ts:41](https://github.com/mxn2020/minions/blob/bcb753ef3e7bd81eeb88732a5f9b118c055a4278/packages/core/src/types/index.ts#L41)

Description of the field's purpose.

***

### required?

> `optional` **required**: `boolean`

Defined in: [types/index.ts:43](https://github.com/mxn2020/minions/blob/bcb753ef3e7bd81eeb88732a5f9b118c055a4278/packages/core/src/types/index.ts#L43)

Whether this field is required. Defaults to false.

***

### defaultValue?

> `optional` **defaultValue**: `unknown`

Defined in: [types/index.ts:45](https://github.com/mxn2020/minions/blob/bcb753ef3e7bd81eeb88732a5f9b118c055a4278/packages/core/src/types/index.ts#L45)

Default value if none is provided.

***

### options?

> `optional` **options**: `string`[]

Defined in: [types/index.ts:47](https://github.com/mxn2020/minions/blob/bcb753ef3e7bd81eeb88732a5f9b118c055a4278/packages/core/src/types/index.ts#L47)

Options for select and multi-select fields.

***

### validation?

> `optional` **validation**: [`FieldValidation`](FieldValidation.md)

Defined in: [types/index.ts:49](https://github.com/mxn2020/minions/blob/bcb753ef3e7bd81eeb88732a5f9b118c055a4278/packages/core/src/types/index.ts#L49)

Additional validation constraints.
