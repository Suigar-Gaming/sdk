# AGENTS.md

This file provides guidance to AI agents working with code in this repository.

## Overview

This repository contains the TypeScript SDK workspace for Suigar v2 on Sui. The current publishable packages are `@suigar/sdk` under `packages/sdk` and `@suigar/mcp` under `packages/mcp`. Both packages are ESM-only. The main public SDK integration surface is the `suigar()` client extension, which is used to build and serialize game transactions on top of `@mysten/sui`.

## Common Commands

### Setup and Build

```bash
# Initial setup
pnpm install

# Generate bindings and build the package
pnpm --dir packages/sdk run build

# Build without regenerating contract bindings
pnpm --dir packages/sdk run build:ci

# Build the MCP package and bundled MCP App
pnpm turbo run build --filter=@suigar/mcp

# Build and run the local stdio MCP server for manual client testing
pnpm turbo run build --filter=@suigar/mcp
node packages/mcp/dist/bin.mjs

# Regenerate Move contract bindings only
pnpm --dir packages/sdk run codegen
```

### Testing

```bash
# Run the full test suite
pnpm --dir packages/sdk run test

# Run type checking
pnpm --dir packages/sdk run typecheck
pnpm --dir packages/mcp run typecheck

# Run a specific vitest file
pnpm --dir packages/sdk exec vitest run test/unit/transactions.test.ts

# Run a specific test name
pnpm --dir packages/sdk exec vitest run -t "builds a coinflip transaction with the configured package id"
```

### Linting and Formatting

```bash
# Check lint and formatting
pnpm run lint

# Auto-fix lint and formatting issues
pnpm run lint:fix
```

### Package Management

```bash
# Create a changeset
pnpm run changeset

# Apply version updates from changesets
pnpm run changeset:version

# Publish release changes
pnpm run release
```

## Architecture

### Repository Structure

- `packages/sdk/` - `@suigar/sdk` package root
  - `src/` - SDK source code
  - `client.ts` - `suigar()` extension registration and extension client implementation
  - `transactions/` - transaction builders for standard and PvP games
  - `contracts/` - generated Move bindings and BCS helpers
  - `types/` - public option and config types
  - `utils/` - public parser, constants, and numeric helpers exposed through `@suigar/sdk/utils`
  - `helpers/` - internal config resolution, metadata encoding, and transaction support helpers
  - `configs/` - network-scoped package ids, supported coin types, and price info object ids
- `packages/sdk/test/unit/` - Vitest coverage for config resolution, cache helpers, and transaction builders
- `packages/mcp/` - `@suigar/mcp` stdio MCP server and MCP App
  - `src/server.ts` - MCP server, tool registration, and app resource registration
  - `src/tools.ts` - SDK-backed tool handlers for config, metadata, and unsigned transaction building
  - `src/app/` - Vite-built single-file MCP App UI
  - `test/` - Vitest coverage for tools and app resource behavior
- `packages/sdk/dist/` - generated build output
- `tsconfig.shared.json` - shared TypeScript compiler options for workspace packages
- `playground/` - workspace-local Next.js integration playground

### Build System

- Uses pnpm workspaces from the private `@suigar/ts-sdks` root package and `pnpm-workspace.yaml`
- Uses `tsdown` to emit ESM-only outputs into `packages/sdk/dist/`
- Uses `tsdown` for package outputs and Vite single-file builds for the MCP App under `packages/mcp/dist/`
- Uses `sui-ts-codegen generate` to regenerate `packages/sdk/src/contracts/`
- Generated contract bindings are runtime-critical and should stay aligned with the current Suigar packages

### Key Patterns

1. **Client extension first**: Prefer integrating through `suigar()` on an existing client such as `SuiGrpcClient` or any other `ClientWithCoreApi` implementation instead of bypassing the extension layer.
2. **Public package exports**: The package exposes `@suigar/sdk`, `@suigar/sdk/games`, and `@suigar/sdk/utils`. The package root exports `suigar`, `SuigarClient`, `SUPPORTED_SUI_NETWORKS`, `SuigarNetwork`, and `SuigarCoin`. Game-related public types and constants such as `GAMES`, `Game`, `StandardGame`, `PvPGame`, `CoinSide`, and `PvPCoinflipAction` should prefer `@suigar/sdk/games`, and parser or helper utilities should prefer `@suigar/sdk/utils`. Reusable SDK constants such as `DEFAULT_GAS_BUDGET_MIST`, `RANGE_POINT_LIMIT`, `DEFAULT_RANGE_SCALE`, and `DEFAULT_LIMBO_MULTIPLIER_SCALE` are part of the intended `@suigar/sdk/utils` integration surface and should not be redefined in app code when the SDK export is suitable. Utility function behavior:
   - `toBigInt()` accepts `bigint`, finite `number`, non-negative integer `string`, and `boolean` values. It throws `TypeError` for invalid input shapes and `RangeError` for negatives.
   - `toU8()` accepts a finite integer `number` or plain integer `string` in the `0..255` range. It throws `TypeError` for non-numeric input and `RangeError` for non-integer or out-of-range values.
   - `toU16()` accepts a finite integer `number` or plain integer `string` in the `0..65535` range. It uses the same `TypeError` and `RangeError` split as `toU8()`.
   - `parseCoinType()` throws `TypeError` when the first generic coin type cannot be parsed from the Move type string.
3. **Transaction builders by game family**: Standard games use `createBetTransaction`; PvP games use dedicated PvP transaction builders. Unsupported game ids, PvP actions, and unsupported configured coin types surface as `RangeError`s.
4. **Generated contract wrappers**: `packages/sdk/src/transactions/` adapts app-facing options into generated Move calls from `packages/sdk/src/contracts/`.
5. **Type safety**: All game flows are strongly typed through `BuildGameOptions`, action-specific PvP options, and normalized config helpers.
6. **MCP uses public SDK APIs**: `@suigar/mcp` should build transactions through `client.suigar.tx`, inspect config through `client.suigar.getConfig()`, and avoid imports from private Suigar workspace packages.

### Suigar Client Architecture

The SDK is organized around a client extension plus typed transaction builders. Understanding that separation is important before changing behavior.

#### Layered Design

The integration has three practical layers:

1. **Public SDK surface** - `suigar()` and `SuigarClient` exposed from the package root, with additional public subpaths for `games` and `utils`.
2. **Client extension implementation** - `packages/sdk/src/client.ts` registers the extension on top of a `ClientWithCoreApi` and exposes serialization, BCS helpers, and transaction builders.
3. **Transaction and contract layer** - `packages/sdk/src/transactions/` consumes network-resolved config, normalizes user input, and invokes generated Move wrappers from `packages/sdk/src/contracts/`.

Key files:

| Layer                       | File                                 |
| --------------------------- | ------------------------------------ |
| Public entrypoint           | `packages/sdk/src/index.ts`          |
| Extension and client API    | `packages/sdk/src/client.ts`         |
| Standard game builders      | `packages/sdk/src/transactions/*.ts` |
| Generated contracts and BCS | `packages/sdk/src/contracts/**`      |
| Public utility exports      | `packages/sdk/src/utils/*.ts`        |
| Internal helper modules     | `packages/sdk/src/helpers/*.ts`      |

#### Standard vs PvP Flows

There are two transaction families and they must not be mixed:

- **Standard games** use `client.suigar.tx.createBetTransaction(gameId, options)` for `coinflip`, `limbo`, `plinko`, `range`, and `wheel`.
- **PvP games** use dedicated PvP transaction builders and should keep PvP game rules separate from standard game flows.
- **PvP coinflip unresolved lobby lookups** use `client.suigar.getPvPCoinflipGames(options?)`:
  - Bulk-load lobby objects with `client.core.getObjects()`.
  - Skip per-object fetch or parse failures by default.
  - Reject on per-object fetch or parse failures only when `throwOnError: true` is passed.
  - Return each parsed game with a derived `coin_type` string from the Move object type.
- **Specific PvP coinflip game object lookups** should use the exported generated helper, `client.suigar.bcs.PvPCoinflipGame.get({ client, objectId })`, when a product needs one live game object outside the registry list.

When making changes:

- Read both the client entrypoint and the relevant transaction builder before changing behavior.
- Keep standard and PvP option shapes separate.
- Do not route PvP coinflip through the standard game builder.

#### Config Resolution

Config is normalized in `packages/sdk/src/helpers/config.ts`. This layer is responsible for:

- resolving network-scoped package ids
- normalizing the configured supported coin types for the active network
- resolving price info object ids from the supported-coin mapping
- throwing explicit errors when a required coin mapping is missing
- providing the price info object id used by PvP coinflip join
- exposing `packageIds.legacyNft` and `packageIds.legacyNftFactory` for applications that need legacy NFT lookups without adding an NFT client surface to this SDK
- treating unsupported network resolution and unsupported configured coin types as `RangeError` cases when documenting or testing these flows

For a directly owned legacy NFT lookup, applications should derive `${client.suigar.getConfig().packageIds.legacyNft}::nft::Nft` and call `client.core.listOwnedObjects({ owner, filter: { StructType: nftType } })`. `legacyNftFactory` is only needed to read the legacy NFT catalog; legacy NFT minting remains outside this SDK.

`client.suigar.getGameParameters(game, options?)` first reads the selected game's settings object from SweetHouse, then reads that game's coin-specific `Parameters<T>` object, parses it with the generated type, decodes Move float fields into JavaScript numbers (including nested Plinko and Wheel config multipliers), and caches the parsed result for `cacheTtl`.

This is a core invariant: standard game transactions must fail clearly when the required price info object configuration is not available for the chosen coin type.

#### Metadata and Amount Handling

- Treat `stake` as the logical wager used in the Move call.
- Use `cashStake` only when the withdrawn balance should differ from the logical stake.
- Prefer `bigint` for all non-UI amount handling.
- Pass plain application values to `metadata` and let the SDK encode them into byte arrays.
- Treat the extension-level `partner` option as a partner wallet address, not a label or slug.
- When partner attribution is required, configure `suigar({ partner: '<wallet-address>' })` once during extension setup instead of passing partner data through transaction metadata.
- Prefer importing public constants and numeric helpers from `@suigar/sdk/utils` instead of duplicating SDK defaults in downstream apps.

### MCP Package Architecture

`packages/mcp` exposes a local stdio MCP server plus a bundled MCP App resource. It should stay thin over `@suigar/sdk` and `@mysten/sui`.

- Register tools with modern MCP SDK APIs such as `McpServer.registerTool` and `registerAppTool`.
- Always return both text `content` and `structuredContent`.
- Keep tool errors actionable and include the field/config/network detail needed for an agent to retry.
- The MCP App is an inspector UI only. It must not sign or execute transactions, and it should include restrictive `_meta.ui.csp` metadata.
- Do not reintroduce explicit coin object sourcing or copied transaction builders unless the SDK adds a public API for that behavior.
- If a new MCP behavior requires an SDK change, add the SDK change, tests, docs, and an `@suigar/sdk` changeset entry in the same task.

### Testing Conventions

- `packages/sdk/test/unit/transactions.test.ts` covers transaction composition, normalization, and generated wrapper integration.
- `packages/sdk/test/unit/config.test.ts` covers config resolution and defaults.
- When changing transaction behavior, update tests to cover package id resolution, owner-address normalization, and action-specific argument mapping.

### Changeset Conventions

- **`patch`**: Bug fixes or internal corrections that do not change the public API shape
- **`minor`**: New public methods, new supported fields, or additive public type changes
- **`major`**: Breaking API changes, changed behavior contracts, or removed support
- Changeset notes must describe only package behavior for the packages listed in the changeset frontmatter. Do not mention root-only, workspace-only, playground-only, or tooling-only changes unless they directly affect that package's published behavior.
- Do not edit changeset files inherited from `main` or previous work. When a branch needs a release note, create or update only the changeset created for the current branch.

### Development Workflow

1. Update or add SDK code in `packages/sdk/src/`
2. If the branch modifies any file under `packages/sdk/src/`, create a `.changeset/*.md` file once for that branch as soon as the first SDK source change is made
3. Reuse only that branch-created changeset for later `packages/sdk/src/` edits instead of creating a new changeset for every additional modification, unless the user explicitly wants multiple distinct release notes
4. Regenerate code with `pnpm --dir packages/sdk run codegen` if contract bindings or package sources changed
5. Run `pnpm --dir packages/sdk run test`
6. Run `pnpm --dir packages/sdk run typecheck`
7. Add or update the current branch changeset when the user-visible package behavior changes, keeping the note scoped to `@suigar/sdk` package changes only

Documentation is part of the deliverable:

- When SDK behavior, public types, generated bindings, examples, or integration guidance change, update the relevant documentation in the same task without waiting for an extra prompt.
- At minimum, review root `README.md`, `packages/sdk/README.md`, `AGENTS.md`, the relevant Suigar skills in `Suigar-Gaming/agent-skills`, and any other user-facing markdown that describes the changed behavior.
- Treat skill updates as automatic follow-up work when their guidance overlaps the changed SDK behavior; do not wait for the user to ask explicitly.
- If constants, helper locations, or public utility exports move, update docs and examples to use the public import path instead of internal file paths or copied values.
- If generated bindings or public runtime ergonomics change, make sure examples and event-decoding guidance stay aligned with the current generated API.
- If installation or client setup guidance changes, keep examples aligned with the current APIs such as `@mysten/sui/grpc`, explicit `network`, and ESM-only package requirements.

## AI Skills

Suigar agent skills live in the separate `Suigar-Gaming/agent-skills` repository.

Install the skills for an agent with the skills CLI:

```bash
npx skills add Suigar-Gaming/agent-skills
```

Install a single skill when only one workflow is needed:

```bash
npx skills add Suigar-Gaming/agent-skills --skill suigar-mcp
```

For Codex-specific installs, add the Codex agent flag without replacing the generic install commands above:

```bash
npx skills add Suigar-Gaming/agent-skills --agent codex --global --yes
```

```bash
npx skills add Suigar-Gaming/agent-skills --skill suigar-mcp --agent codex --global --yes
```

Use these Suigar skills when the task is about building a product on top of this SDK:

- `installation` for SDK setup, client extension wiring, and config
- `suigar-mcp` for installing, configuring, and operating the `@suigar/mcp` server and MCP App
- `create-standard-games` for standard game transactions
- `create-pvp-games` for PvP game flows
- `find-skills` to discover installable external skills when users ask for capabilities or workflows that may already exist

Claude Code compatibility:

- `CLAUDE.md` is a symlink to `AGENTS.md`

## Pull Requests

When creating a PR:

- summarize the SDK or transaction behavior change clearly
- if the branch modifies anything under `packages/sdk/src/`, make sure the branch includes a `.changeset/*.md` file; create one on the first SDK source change, then keep reusing that same branch changeset instead of creating multiple changesets for repeated SDK source edits unless multiple release notes are intentionally needed
- PRs that change `packages/sdk/src/` without a changeset are expected to fail merge checks and receive a PR comment
- mention whether generated bindings changed
- include tests run
- if the PR was primarily written by AI, mark that in the PR description
