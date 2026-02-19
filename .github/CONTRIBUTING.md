# Contributing to Minions

Thank you for your interest in contributing to Minions!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/minions.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feature/my-feature`

## Development

```bash
# Build all packages
pnpm run build

# Run tests
pnpm run test

# Type check
pnpm run lint
```

## Project Structure

- `packages/core/` — Framework-agnostic core library
- `packages/cli/` — CLI tool
- `apps/docs/` — Astro Starlight documentation site
- `apps/web/` — Marketing / playground web app
- `spec/` — Specification documents
- `examples/` — Usage examples

## Pull Request Process

1. Ensure your code passes `pnpm run lint` and `pnpm run test`
2. Update documentation if your changes affect the public API
3. Add tests for new functionality
4. Keep PRs focused — one feature or fix per PR

## Code Style

- TypeScript strict mode
- ESM modules
- JSDoc on all public exports
- No runtime dependencies in `minions-sdk` (except validation)

## Spec Changes

Changes to the specification (`spec/`) require discussion in an issue first. The spec is versioned — breaking changes go into a new spec version.

## License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 License.
