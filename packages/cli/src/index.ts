#!/usr/bin/env node

/**
 * @module @minions/cli
 * CLI tool for the Minions structured object system.
 */

import { SPEC_VERSION, TypeRegistry, validateFields } from '@minions/core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

const args = process.argv.slice(2);
const command = args[0];
const subcommand = args[1];

function printHelp(): void {
  console.log(`
minions - CLI for the Minions structured object system

USAGE:
  minions <command> [options]

COMMANDS:
  init              Scaffold a new minions project
  type create       Interactively create a new minion type
  type list         List all registered types
  validate <file>   Validate a minion JSON file against its type schema
  spec              Print the current spec version
  help              Show this help message

VERSION: ${SPEC_VERSION}
`);
}

function printSpec(): void {
  console.log(`Minions Specification Version: ${SPEC_VERSION}`);
}

function loadCustomTypes(registry: TypeRegistry): void {
  // Try to read minionsDir from config, fall back to cwd
  const cwd = process.cwd();
  let typesDir = cwd;
  const configPath = path.join(cwd, 'minions.config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.typesDir) {
        typesDir = path.resolve(cwd, config.typesDir);
      }
    } catch { /* ignore config parse errors */ }
  }

  if (!fs.existsSync(typesDir)) return;
  const files = fs.readdirSync(typesDir).filter(f => f.endsWith('.type.json'));

  if (files.length > 0) {
    console.log(`Found ${files.length} custom type definition(s).`);
  }

  for (const file of files) {
    try {
      const filePath = path.join(typesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const typeDef = JSON.parse(content);

      // Basic validation that it looks like a MinionType
      if (!typeDef.id || !typeDef.slug || !typeDef.name) {
        console.warn(`⚠️ Skipping ${file}: Missing id, slug, or name.`);
        continue;
      }

      registry.register(typeDef);
      console.log(`   Loaded custom type: ${typeDef.slug} (${typeDef.name})`);
    } catch (e: any) {
      console.warn(`⚠️ Failed to load ${file}: ${e.message}`);
    }
  }
}

function listTypes(): void {
  const registry = new TypeRegistry();
  loadCustomTypes(registry);
  const types = registry.list();
  console.log(`\nRegistered Minion Types (${types.length}):\n`);
  console.log('  Slug                 Name                 System   Description');
  console.log('  ' + '─'.repeat(80));
  for (const t of types) {
    const slug = t.slug.padEnd(20);
    const name = t.name.padEnd(20);
    const sys = (t.isSystem ? 'yes' : 'no').padEnd(8);
    console.log(`  ${slug} ${name} ${sys} ${t.description ?? ''}`);
  }
  console.log('');
}

function validateFile(filePath: string): void {
  if (!filePath) {
    console.error('Error: Please provide a file path to validate.');
    process.exit(1);
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: File not found: ${resolved}`);
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(resolved, 'utf-8');
    const minion = JSON.parse(content);

    if (!minion.minionTypeId) {
      console.error('Error: JSON must have a "minionTypeId" field.');
      process.exit(1);
    }

    const registry = new TypeRegistry();
    loadCustomTypes(registry);
    const type = registry.getById(minion.minionTypeId) ?? registry.getBySlug(minion.minionTypeId);

    if (!type) {
      console.error(`Error: Unknown minion type: ${minion.minionTypeId}`);
      console.error(`  Hint: Use the type ID (e.g. "builtin-agent"), not the slug (e.g. "agent").`);
      console.error('  Available types:');
      for (const t of registry.list()) {
        console.error(`    - ${t.id} (slug: ${t.slug})`);
      }
      process.exit(1);
    }

    const result = validateFields(minion.fields ?? {}, type.schema);

    if (result.valid) {
      console.log(`✅ Valid ${type.name} minion: ${resolved}`);
    } else {
      console.log(`❌ Invalid ${type.name} minion: ${resolved}`);
      for (const err of result.errors) {
        console.log(`   - ${err.field}: ${err.message}`);
      }
      process.exit(1);
    }
  } catch (e: any) {
    console.error(`Error parsing JSON: ${e.message}`);
    process.exit(1);
  }
}

function initProject(): void {
  const configPath = path.resolve('minions.config.json');
  if (fs.existsSync(configPath)) {
    console.log('minions.config.json already exists.');
    return;
  }

  const config = {
    specVersion: SPEC_VERSION,
    types: [],
    minionsDir: './minions',
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  fs.mkdirSync(path.resolve('minions'), { recursive: true });

  // Create an example note minion
  const exampleMinion = {
    title: 'My First Note',
    minionTypeId: 'builtin-note',
    status: 'active',
    fields: {
      content: 'This is an example minion created by `minions init`.',
    },
  };
  const examplePath = path.resolve('minions', 'example-note.json');
  fs.writeFileSync(examplePath, JSON.stringify(exampleMinion, null, 2) + '\n');

  console.log('✅ Initialized minions project.');
  console.log('   Created: minions.config.json');
  console.log('   Created: minions/');
  console.log('   Created: minions/example-note.json');
}

async function createType(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string): Promise<string> => new Promise((resolve) => rl.question(q, resolve));

  console.log('\nCreate a new Minion Type\n');

  const name = await ask('Name: ');
  const slug = await ask(`Slug (${name.toLowerCase().replace(/\s+/g, '-')}): `) || name.toLowerCase().replace(/\s+/g, '-');
  const description = await ask('Description: ');
  const icon = await ask('Icon (emoji): ');

  const type = {
    id: `custom-${slug}`,
    name,
    slug,
    description,
    icon: icon || undefined,
    isSystem: false,
    schema: [
      {
        name: 'content',
        type: 'textarea',
        required: true,
        description: 'Main content field — replace with your own fields (see: minions type list)',
      }
    ],
  };

  // Resolve output directory: use typesDir from config if present, else cwd
  const cwd = process.cwd();
  let typesDir = cwd;
  const configPath = path.join(cwd, 'minions.config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.typesDir) {
        typesDir = path.resolve(cwd, config.typesDir);
        fs.mkdirSync(typesDir, { recursive: true });
      }
    } catch { /* ignore config parse errors */ }
  }

  const filename = path.join(typesDir, `${slug}.type.json`);
  fs.writeFileSync(filename, JSON.stringify(type, null, 2) + '\n');
  console.log(`\n✅ Created type definition: ${filename}`);
  rl.close();
}

// ─── Route Commands ──────────────────────────────────────────────────────────

switch (command) {
  case 'spec':
    printSpec();
    break;
  case 'type':
    if (subcommand === 'list') listTypes();
    else if (subcommand === 'create') createType();
    else printHelp();
    break;
  case 'validate':
    validateFile(args[1]);
    break;
  case 'init':
    initProject();
    break;
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    printHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
}
