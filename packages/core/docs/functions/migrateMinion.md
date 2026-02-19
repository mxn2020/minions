[**@minions/core v0.1.0**](../README.md)

***

[@minions/core](../README.md) / migrateMinion

# Function: migrateMinion()

> **migrateMinion**(`minion`, `oldSchema`, `newSchema`): [`Minion`](../interfaces/Minion.md)

Defined in: [evolution/index.ts:23](https://github.com/mxn2020/minions/blob/4da812d85216654326d9a2df90976be93221a56a/packages/core/src/evolution/index.ts#L23)

Migrate a minion from an old schema to a new schema.

Rules:
- Fields added in new schema: get default value or remain absent
- Fields removed from schema: values move to `_legacy`
- Fields whose type changed: if value doesn't match new type, move to `_legacy`
- Fields made required: if missing, minion is flagged (via validation)

## Parameters

### minion

[`Minion`](../interfaces/Minion.md)

The minion to migrate

### oldSchema

[`FieldDefinition`](../interfaces/FieldDefinition.md)[]

The previous field definitions

### newSchema

[`FieldDefinition`](../interfaces/FieldDefinition.md)[]

The new field definitions

## Returns

[`Minion`](../interfaces/Minion.md)

The migrated minion
