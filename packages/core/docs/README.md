**@minions/core v0.1.0**

***

# @minions/core v0.1.0

## Example

```typescript
import { TypeRegistry, createMinion, RelationGraph } from '@minions/core';

const registry = new TypeRegistry();
const agentType = registry.getBySlug('agent')!;

const { minion, validation } = createMinion({
  title: 'Research Assistant',
  minionTypeId: agentType.id,
  fields: {
    role: 'researcher',
    model: 'gpt-4',
    systemPrompt: 'You are a research assistant.',
    tools: ['web-search', 'summarize'],
  },
}, agentType);
```

## Classes

- [TypeRegistry](classes/TypeRegistry.md)
- [RelationGraph](classes/RelationGraph.md)

## Interfaces

- [FieldValidation](interfaces/FieldValidation.md)
- [FieldDefinition](interfaces/FieldDefinition.md)
- [Minion](interfaces/Minion.md)
- [MinionType](interfaces/MinionType.md)
- [Relation](interfaces/Relation.md)
- [CreateMinionInput](interfaces/CreateMinionInput.md)
- [UpdateMinionInput](interfaces/UpdateMinionInput.md)
- [CreateRelationInput](interfaces/CreateRelationInput.md)
- [ExecutionResult](interfaces/ExecutionResult.md)
- [Executable](interfaces/Executable.md)
- [ValidationError](interfaces/ValidationError.md)
- [ValidationResult](interfaces/ValidationResult.md)

## Type Aliases

- [FieldType](type-aliases/FieldType.md)
- [RelationType](type-aliases/RelationType.md)
- [MinionStatus](type-aliases/MinionStatus.md)
- [MinionPriority](type-aliases/MinionPriority.md)

## Variables

- [SPEC\_VERSION](variables/SPEC_VERSION.md)
- [noteType](variables/noteType.md)
- [linkType](variables/linkType.md)
- [fileType](variables/fileType.md)
- [contactType](variables/contactType.md)
- [agentType](variables/agentType.md)
- [teamType](variables/teamType.md)
- [thoughtType](variables/thoughtType.md)
- [promptTemplateType](variables/promptTemplateType.md)
- [testCaseType](variables/testCaseType.md)
- [taskType](variables/taskType.md)
- [builtinTypes](variables/builtinTypes.md)

## Functions

- [migrateMinion](functions/migrateMinion.md)
- [createMinion](functions/createMinion.md)
- [updateMinion](functions/updateMinion.md)
- [softDelete](functions/softDelete.md)
- [hardDelete](functions/hardDelete.md)
- [restoreMinion](functions/restoreMinion.md)
- [generateId](functions/generateId.md)
- [now](functions/now.md)
- [validateField](functions/validateField.md)
- [validateFields](functions/validateFields.md)
