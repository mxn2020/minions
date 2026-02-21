# minions-cli

> CLI tool for the Minions structured object system — validate, scaffold, and manage minion types from the terminal.

[![npm](https://img.shields.io/npm/v/minions-cli.svg)](https://www.npmjs.com/package/minions-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/mxn2020/minions/blob/main/LICENSE)

---

## Install

```bash
npm install -g minions-cli
```

## Commands

```
minions <command> [options]

COMMANDS:
  init              Scaffold a new minions project
  type create       Interactively create a new minion type
  type list         List all registered types (built-in + custom)
  validate <file>   Validate a minion JSON file against its type schema
  spec              Print the current spec version
  help              Show help
```

## Usage Examples

### Scaffold a project

```bash
minions init
# ✅ Creates minions.config.json and minions/ directory with an example note
```

### List all types

```bash
minions type list
# Shows all built-in types (agent, note, task, team, …) plus any custom types
```

### Validate a minion file

```bash
minions validate minions/my-agent.json
# ✅ Valid Agent minion: minions/my-agent.json
```

### Create a custom type

```bash
minions type create
# Interactive wizard — creates a .type.json definition file
```

## Custom Types

Place `*.type.json` files in your project directory (or the path set by `typesDir` in `minions.config.json`). The CLI will automatically discover and register them.

## Related

- [`minions-sdk`](https://www.npmjs.com/package/minions-sdk) — core TypeScript SDK
- 📘 [Documentation](https://minions.help)

## License

[MIT](https://github.com/mxn2020/minions/blob/main/LICENSE) — Copyright (c) 2024 Mehdi Nabhani.
