# AGENTS.md

This file provides guidance to AI agents working with code in this repository.

## Overview

This repository contains the TypeScript SDK for Suigar v2 on Sui. It is a single-package SDK built with TypeScript, `tsup`, and generated Move contract bindings. The main public integration surface is the `suigar()` client extension and `SuigarClient`, which are used to build and serialize casino game transactions on top of `@mysten/sui`.

## Common Commands

### Setup and Build

```bash
# Initial setup
npm install

# Generate bindings and build the package
npm run build

# Build without regenerating contract bindings
npm run build:ci

# Regenerate Move contract bindings only
npm run codegen
```

### Testing

```bash
# Run the full test suite
npm test

# Run type checking
npm run typecheck

# Run a specific vitest file
npx vitest run test/transactions.test.ts

# Run a specific test name
npx vitest run -t "builds a coinflip transaction with the configured package id"
```

### Linting and Formatting

```bash
# Auto-fix lint and formatting issues
npm run lint

# Format the repository
npm run format
```

### Package Management

```bash
# Create a changeset
npm run changeset

# Apply version updates from changesets
npm run version-packages

# Publish release changes
npm run release
```

## Architecture

### Repository Structure

- `src/` - SDK source code
  - `client.ts` - `suigar()` extension registration and `SuigarClient`
  - `transactions/` - transaction builders for standard and PvP games
  - `contracts/` - generated Move bindings and BCS helpers
  - `types/` - public option and config types
  - `utils/` - config resolution, metadata encoding, and shared helpers
  - `configs/` - default package ids and coin type configuration
- `test/` - Vitest coverage for config resolution and transaction builders
- `dist/` - generated build output
- `.agents/skills/` - repo-local skills for casino-specific AI workflows

### Build System

- Uses `tsup` to emit both ESM and CJS outputs into `dist/`
- Uses `sui-ts-codegen generate` to regenerate `src/contracts/`
- Generated contract bindings are runtime-critical and should stay aligned with the current Suigar packages

### Key Patterns

1. **Client extension first**: Prefer integrating through `suigar()` on an existing `SuiClient` instead of bypassing the extension layer.
2. **Public root exports**: The package root currently exports `suigar` and `SuigarClient`. Do not invent additional root exports.
3. **Transaction builders by game family**: Standard games use `createBetTransaction`; PvP games use dedicated PvP transaction builders.
4. **Generated contract wrappers**: `src/transactions/` adapts app-facing options into generated Move calls from `src/contracts/`.
5. **Type safety**: All game flows are strongly typed through `BuildGameOptions`, action-specific PvP options, and normalized config helpers.

### Suigar Client Architecture

The SDK is organized around a client extension plus typed transaction builders. Understanding that separation is important before changing behavior.

#### Layered Design

The integration has three practical layers:

1. **Public SDK surface** - `suigar()` and `SuigarClient` exposed from the package root.
2. **Client extension implementation** - `src/client.ts` registers the extension on top of a `ClientWithCoreApi` and exposes serialization, BCS helpers, and transaction builders.
3. **Transaction and contract layer** - `src/transactions/` resolves config, normalizes user input, and invokes generated Move wrappers from `src/contracts/`.

Key files:

| Layer                       | File                    |
| --------------------------- | ----------------------- |
| Public entrypoint           | `src/index.ts`          |
| Extension and client API    | `src/client.ts`         |
| Standard game builders      | `src/transactions/*.ts` |
| Generated contracts and BCS | `src/contracts/**`      |
| Config and metadata helpers | `src/utils/*.ts`        |

#### Standard vs PvP Flows

There are two transaction families and they must not be mixed:

- **Standard games** use `client.suigar.tx.createBetTransaction(gameId, options)` for `coinflip`, `limbo`, `plinko`, `range`, and `wheel`.
- **PvP games** use dedicated PvP transaction builders and should keep PvP game rules separate from standard game flows.

When making changes:

- Read both the client entrypoint and the relevant transaction builder before changing behavior.
- Keep standard and PvP option shapes separate.
- Do not route PvP coinflip through the standard game builder.

#### Config Resolution

Config is normalized in `src/utils/config.ts`. This layer is responsible for:

- resolving default package ids
- normalizing struct tags for supported coin types
- resolving Pyth price info object ids
- throwing explicit errors when a required coin mapping is missing

This is a core invariant: standard game transactions must fail clearly when the required Pyth object configuration is not available for the chosen coin type.

#### Metadata and Amount Handling

- Treat `stake` as the logical wager used in the Move call.
- Use `cashStake` only when the withdrawn balance should differ from the logical stake.
- Prefer `bigint` for all non-UI amount handling.
- Pass plain application values to `metadata` and let the SDK encode them into byte arrays.

### Testing Conventions

- `test/transactions.test.ts` covers transaction composition, normalization, and generated wrapper integration.
- `test/config.test.ts` covers config resolution and defaults.
- When changing transaction behavior, update tests to cover package id resolution, sender normalization, and action-specific argument mapping.

### Changeset Conventions

- **`patch`**: Bug fixes or internal corrections that do not change the public API shape
- **`minor`**: New public methods, new supported fields, or additive public type changes
- **`major`**: Breaking API changes, changed behavior contracts, or removed support

### Development Workflow

1. Update or add code in `src/`
2. Regenerate code with `npm run codegen` if contract bindings or package sources changed
3. Run `npm test`
4. Run `npm run typecheck`
5. Add a changeset when the user-visible package behavior changes

## AI Skills

Use the repo-local skills in `.agents/skills/` when the task is about building a casino product on top of this SDK:

- `installation` for SDK setup, client extension wiring, and config
- `create-standard-games` for standard game transactions
- `create-pvp-games` for PvP game flows
- `find-skills` to discover installable external skills when users ask for capabilities or workflows that may already exist

Claude Code compatibility:

- `.claude/skills` mirrors `.agents/skills`
- `CLAUDE.md` exists at the repository root for Claude-oriented repository guidance

## Pull Requests

When creating a PR:

- summarize the SDK or transaction behavior change clearly
- mention whether generated bindings changed
- include tests run
- if the PR was primarily written by AI, mark that in the PR description
