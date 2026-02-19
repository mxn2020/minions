[**minions-core v0.1.0**](../README.md)

***

[minions-core](../README.md) / TypeRegistry

# Class: TypeRegistry

Defined in: [registry/index.ts:13](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/registry/index.ts#L13)

An in-memory registry for MinionTypes.
Pre-loaded with all built-in system types.

## Constructors

### Constructor

> **new TypeRegistry**(`loadBuiltins?`): `TypeRegistry`

Defined in: [registry/index.ts:17](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/registry/index.ts#L17)

#### Parameters

##### loadBuiltins?

`boolean` = `true`

#### Returns

`TypeRegistry`

## Methods

### register()

> **register**(`type`): `void`

Defined in: [registry/index.ts:29](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/registry/index.ts#L29)

Register a MinionType in the registry.

#### Parameters

##### type

[`MinionType`](../interfaces/MinionType.md)

#### Returns

`void`

#### Throws

Error if a type with the same id or slug already exists.

***

### getById()

> **getById**(`id`): [`MinionType`](../interfaces/MinionType.md) \| `undefined`

Defined in: [registry/index.ts:44](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/registry/index.ts#L44)

Get a type by its ID.

#### Parameters

##### id

`string`

#### Returns

[`MinionType`](../interfaces/MinionType.md) \| `undefined`

The MinionType or undefined if not found.

***

### getBySlug()

> **getBySlug**(`slug`): [`MinionType`](../interfaces/MinionType.md) \| `undefined`

Defined in: [registry/index.ts:52](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/registry/index.ts#L52)

Get a type by its slug.

#### Parameters

##### slug

`string`

#### Returns

[`MinionType`](../interfaces/MinionType.md) \| `undefined`

The MinionType or undefined if not found.

***

### list()

> **list**(): [`MinionType`](../interfaces/MinionType.md)[]

Defined in: [registry/index.ts:60](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/registry/index.ts#L60)

List all registered types.

#### Returns

[`MinionType`](../interfaces/MinionType.md)[]

***

### has()

> **has**(`id`): `boolean`

Defined in: [registry/index.ts:67](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/registry/index.ts#L67)

Check if a type exists by ID.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### remove()

> **remove**(`id`): `boolean`

Defined in: [registry/index.ts:75](https://github.com/mxn2020/minions/blob/52978fbc1436796e6df75d6f5ad5823d4d3faa8f/packages/core/src/registry/index.ts#L75)

Remove a type from the registry.

#### Parameters

##### id

`string`

#### Returns

`boolean`

true if the type was removed.
