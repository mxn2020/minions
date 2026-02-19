/**
 * @module minions-sdk/schemas
 * Standard built-in MinionType schemas shipped with every Minions implementation.
 */

import type { MinionType } from '../types/index.js';

/** Built-in type: Note — a simple text note. */
export const noteType: MinionType = {
  id: 'builtin-note',
  name: 'Note',
  slug: 'note',
  description: 'A simple text note.',
  icon: '📝',
  isSystem: true,
  schema: [
    { name: 'content', type: 'textarea', label: 'Content', required: true },
  ],
};

/** Built-in type: Link — a web bookmark. */
export const linkType: MinionType = {
  id: 'builtin-link',
  name: 'Link',
  slug: 'link',
  description: 'A web link or bookmark.',
  icon: '🔗',
  isSystem: true,
  schema: [
    { name: 'url', type: 'url', label: 'URL', required: true },
    { name: 'description', type: 'textarea', label: 'Description' },
  ],
};

/** Built-in type: File — a file attachment reference. */
export const fileType: MinionType = {
  id: 'builtin-file',
  name: 'File',
  slug: 'file',
  description: 'A file attachment reference.',
  icon: '📎',
  isSystem: true,
  schema: [
    { name: 'filename', type: 'string', label: 'Filename', required: true },
    { name: 'fileUrl', type: 'url', label: 'File URL', required: true },
    { name: 'fileSize', type: 'number', label: 'File Size (bytes)' },
    { name: 'mimeType', type: 'string', label: 'MIME Type' },
  ],
};

/** Built-in type: Contact — a person or entity. */
export const contactType: MinionType = {
  id: 'builtin-contact',
  name: 'Contact',
  slug: 'contact',
  description: 'A person or entity contact record.',
  icon: '👤',
  isSystem: true,
  schema: [
    { name: 'name', type: 'string', label: 'Name', required: true },
    { name: 'email', type: 'email', label: 'Email' },
    { name: 'phone', type: 'string', label: 'Phone' },
    { name: 'company', type: 'string', label: 'Company' },
    { name: 'notes', type: 'textarea', label: 'Notes' },
  ],
};

// ─── Layer Types ─────────────────────────────────────────────────────────────

/** Definition Layer: Agent — an AI agent definition. */
export const agentType: MinionType = {
  id: 'builtin-agent',
  name: 'Agent',
  slug: 'agent',
  description: 'An AI agent definition.',
  icon: '🤖',
  isSystem: true,
  schema: [
    { name: 'role', type: 'string', label: 'Role' },
    { name: 'model', type: 'string', label: 'Model' },
    { name: 'systemPrompt', type: 'textarea', label: 'System Prompt' },
    { name: 'temperature', type: 'number', label: 'Temperature', validation: { min: 0, max: 2 } },
    { name: 'maxTokens', type: 'number', label: 'Max Tokens' },
    { name: 'tools', type: 'tags', label: 'Tools' },
  ],
};

/** Organization Layer: Team — a group of agents or minions. */
export const teamType: MinionType = {
  id: 'builtin-team',
  name: 'Team',
  slug: 'team',
  description: 'A group of agents working together.',
  icon: '👥',
  isSystem: true,
  isOrganizational: true,
  schema: [
    { name: 'members', type: 'tags', label: 'Members' },
    { name: 'strategy', type: 'select', label: 'Strategy', options: ['round_robin', 'parallel', 'sequential'] },
    { name: 'maxConcurrency', type: 'number', label: 'Max Concurrency' },
  ],
};

/** Memory Layer: Thought — a recorded thought or observation. */
export const thoughtType: MinionType = {
  id: 'builtin-thought',
  name: 'Thought',
  slug: 'thought',
  description: 'A recorded thought, observation, or memory.',
  icon: '💭',
  isSystem: true,
  schema: [
    { name: 'content', type: 'textarea', label: 'Content', required: true },
    { name: 'confidence', type: 'number', label: 'Confidence', validation: { min: 0, max: 1 } },
    { name: 'source', type: 'string', label: 'Source' },
  ],
};

/** Interface Layer: Prompt Template — a reusable prompt template. */
export const promptTemplateType: MinionType = {
  id: 'builtin-prompt-template',
  name: 'Prompt Template',
  slug: 'prompt-template',
  description: 'A reusable prompt template with variables.',
  icon: '📋',
  isSystem: true,
  schema: [
    { name: 'template', type: 'textarea', label: 'Template', required: true },
    { name: 'variables', type: 'tags', label: 'Variables' },
    { name: 'outputFormat', type: 'select', label: 'Output Format', options: ['text', 'json', 'markdown'] },
  ],
};

/** Evaluation Layer: Test Case — a test case for agent evaluation. */
export const testCaseType: MinionType = {
  id: 'builtin-test-case',
  name: 'Test Case',
  slug: 'test-case',
  description: 'A test case for evaluating agent behavior.',
  icon: '🧪',
  isSystem: true,
  schema: [
    { name: 'input', type: 'json', label: 'Input', required: true },
    { name: 'expectedOutput', type: 'json', label: 'Expected Output' },
    { name: 'assertions', type: 'json', label: 'Assertions' },
    { name: 'timeout', type: 'number', label: 'Timeout (ms)' },
  ],
};

/** Execution Layer: Task — a unit of work to be executed. */
export const taskType: MinionType = {
  id: 'builtin-task',
  name: 'Task',
  slug: 'task',
  description: 'A unit of work to be executed.',
  icon: '⚡',
  isSystem: true,
  schema: [
    { name: 'input', type: 'json', label: 'Input' },
    { name: 'output', type: 'json', label: 'Output' },
    { name: 'executionStatus', type: 'select', label: 'Execution Status', options: ['pending', 'running', 'completed', 'failed', 'cancelled'] },
    { name: 'startedAt', type: 'date', label: 'Started At' },
    { name: 'completedAt', type: 'date', label: 'Completed At' },
    { name: 'error', type: 'textarea', label: 'Error' },
  ],
};

/** All built-in types as an array. */
export const builtinTypes: MinionType[] = [
  noteType,
  linkType,
  fileType,
  contactType,
  agentType,
  teamType,
  thoughtType,
  promptTemplateType,
  testCaseType,
  taskType,
];
