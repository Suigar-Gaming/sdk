# @suigar/mcp

## 0.2.0-beta.2

### Patch Changes

- fa98228: Update the MCP package build tooling to use the latest Vite version.
- be41b9b: Refactor the bundled MCP App inspector into a React component app and reorganize the MCP package internals.

  The bundled MCP App now uses React, Tailwind theme tokens, and smaller inspector components for context, transaction, gas, dry-run, notes, errors, targets, and raw payload views. The app also uses package-version injection from `package.json`, renders status labels consistently, shows compact status and coin-symbol badges, removes decorative shadows, shows a compact connection state before host context is available, and keeps tool results visible when they arrive before host context.

  The MCP server source is split into runtime, server, and tool modules while keeping the published entrypoints unchanged. Tool handlers, schemas, app resource registration, dry-run helpers, formatting helpers, and runtime client helpers now live in focused files with tests organized to match.

## 0.2.0-beta.1

### Patch Changes

- 4a04248: Update MCP tool schemas for Zod compatibility.

## 0.2.0-beta.0

### Minor Changes

- d597399: Add MCP App support and refreshed transaction tooling.

  Add the bundled Suigar Transaction Inspector MCP App, concise `suigar` server-scoped tool names, read-only/build/dry-run transaction modes, currency-denominated stake handling, SuiNS owner resolution, game-specific transaction summaries, dry-run gas and balance summaries, extracted dry-run errors, decoded event fields, and coverage for the updated tool behavior.

  The package metadata is refreshed for the current SDK dependency set, and the package build uses `tsdown` dependency bundling for private Suigar workspace packages while keeping `@suigar/sdk` external as the published runtime SDK dependency.

### Patch Changes

- Updated dependencies [4923f91]
- Updated dependencies [802e082]
- Updated dependencies [d597399]
- Updated dependencies [d597399]
  - @suigar/sdk@2.0.0-beta.22

## 0.1.1

### Patch Changes

- f9d219c: Bump `@suigar/mcp` to `0.1.1` and refresh package metadata for the current SDK dependency set.
- 4d21957: Replace pack-time dependency staging scripts with `tsdown` dependency bundling, so private Suigar workspace packages are compiled into the MCP output instead of being copied into the published tarball.
- 135e404: Broaden the MCP bundle rule to include future `@suigar/*` workspace packages while keeping `@suigar/sdk` external as the published runtime SDK dependency.

## 0.1.0

### Minor Changes

- dca5598: Initial release of `@suigar/mcp`, a lightweight MCP server and library for Suigar game tooling.
  - Add config and metadata read helpers backed by released `@suigar/sdk` defaults.
  - Add MCP tools for building and dry-running on-chain transactions for coinflip, limbo, plinko, range, wheel, and PvP coinflip.
  - Add shared MCP support metadata so clients can distinguish on-chain games from unsupported backend-driven games such as slots.
  - Add transaction serialization helpers, read-only Sui client setup, stdio server entrypoint, tests, and README usage guidance.
