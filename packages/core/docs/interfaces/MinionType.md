[**@minions/core v0.1.0**](../README.md)

***

[@minions/core](../README.md) / MinionType

# Interface: MinionType

Defined in: [types/index.ts:127](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L127)

A MinionType defines the schema and behavior of a kind of minion.

## Properties

### id

> **id**: `string`

Defined in: [types/index.ts:129](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L129)

Unique identifier (UUID v4).

***

### name

> **name**: `string`

Defined in: [types/index.ts:131](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L131)

Human-readable name.

***

### slug

> **slug**: `string`

Defined in: [types/index.ts:133](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L133)

URL-safe kebab-case slug, unique within the system.

***

### schema

> **schema**: [`FieldDefinition`](FieldDefinition.md)[]

Defined in: [types/index.ts:135](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L135)

JSON Schema-style field definitions.

***

### description?

> `optional` **description**: `string`

Defined in: [types/index.ts:137](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L137)

Description of this type's purpose.

***

### icon?

> `optional` **icon**: `string`

Defined in: [types/index.ts:139](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L139)

Emoji or icon identifier.

***

### color?

> `optional` **color**: `string`

Defined in: [types/index.ts:141](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L141)

Hex color code.

***

### isSystem?

> `optional` **isSystem**: `boolean`

Defined in: [types/index.ts:143](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L143)

Whether this is a built-in system type.

***

### isOrganizational?

> `optional` **isOrganizational**: `boolean`

Defined in: [types/index.ts:145](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L145)

Whether this type represents an organizational container.

***

### allowedChildTypes?

> `optional` **allowedChildTypes**: `string`[]

Defined in: [types/index.ts:147](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L147)

Type IDs that are allowed as children via parent_of relations.

***

### behaviors?

> `optional` **behaviors**: `string`[]

Defined in: [types/index.ts:149](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L149)

Named behavior flags (e.g. "executable", "cacheable").

***

### defaultView?

> `optional` **defaultView**: `string`

Defined in: [types/index.ts:151](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L151)

Default view mode.

***

### availableViews?

> `optional` **availableViews**: `string`[]

Defined in: [types/index.ts:153](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L153)

All available view modes.

***

### createdAt?

> `optional` **createdAt**: `string`

Defined in: [types/index.ts:155](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L155)

ISO 8601 creation timestamp.

***

### updatedAt?

> `optional` **updatedAt**: `string`

Defined in: [types/index.ts:157](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/types/index.ts#L157)

ISO 8601 last-update timestamp.
