# @suigar/mcp

## 1.0.0-beta.18

### Minor Changes

- 53f4f3b: Add a persistent local session wallet shared by mainnet and testnet, with setup, recovery, direct import of standard `suiprivkey...` exports, and direct game-transaction execution backed by the operating system keychain. Private-key imports remain on the localhost-only setup page and are never included in MCP output or the session-wallet JSON file. Setup guidance and local pages identify it as a cross-network wallet rather than a network-specific wallet. `get_session_wallet` now includes complete formatted balances for the selected network and a prefilled paired-wallet funding URL when available, rendered in its dedicated Session Wallet view. When no wallet exists, that view provides the local setup link. Add `fund_session_wallet` to return a paired-wallet funding URL prefilled with the local session wallet address.

### Patch Changes

- 37d17de: Update SDK and MCP compatibility with the latest patch release of the shared `@mysten/sui` dependency.
- Updated dependencies [37d17de]
  - @suigar/sdk@2.0.0-beta.34

## 1.0.0-beta.17

### Minor Changes

- 7eb72bc: Add browser-mediated wallet connections and explicit transaction approval flows, along with wallet balance and coin-object inspection tools and MCP App views.
- ab6bab9: Add a configured NFT V1 mint transaction builder that mints directly to the sender.

### Patch Changes

- Updated dependencies [ab6bab9]
  - @suigar/sdk@2.0.0-beta.33

## 1.0.0-beta.16

### Patch Changes

- d436728: Update `"@modelcontextprotocol/sdk` to `^1.3.0` to fix hono security issues

## 1.0.0-beta.15

### Major Changes

- 5f53b3f: Reorganize the client extension transaction API. Rename `client.suigar.tx.createBetTransaction(game, options)` to `client.suigar.tx.createGameBet(game, options)`, and replace `createPvPCoinflipTransaction(action, options)` with action-specific `client.suigar.tx.pvpCoinflip.createGame(options)`, `.joinGame(options)`, and `.cancelGame(options)` builders. Rename public transaction option types to reflect their game or action inputs, including `CreateGameBetOptions`, `RangeTransactionOptions`, and the PvP coinflip transaction option types.

### Minor Changes

- 3335aa7: Add composable and complete referrer commission and level-up USD reward claim transactions.

  Add referral commission and level-up USD reward reads plus unsigned claim transaction builders.

- e029500: Refresh compatibility with the latest supported Mysten Sui libraries.

### Patch Changes

- 9a7d55f: Use the canonical Sui address and unit-formatting utilities across the MCP server and app.
- 9a7d55f: Standardize internal array type annotations for TypeScript consistency.
- 3335aa7: Clarify that `getGameParameters` requires a coin type when loading coin-specific game parameters.
- Updated dependencies [3335aa7]
- Updated dependencies [e029500]
- Updated dependencies [9a7d55f]
- Updated dependencies [3335aa7]
- Updated dependencies [5f53b3f]
  - @suigar/sdk@2.0.0-beta.32

## 1.0.0-beta.14

### Major Changes

- fa890ea: Rename the NFT configuration and BCS APIs from legacy names to NFT V1 names, and generate the NFT V1 decoding bindings from the on-chain package.

### Minor Changes

- fa890ea: Add Soccer transaction planning and unsigned transaction building. Align SDK configuration overrides with separate package, object, and registry id groups.

### Patch Changes

- d32fc51: Refresh Mysten and build-tool dependency metadata.
- Updated dependencies [fa890ea]
- Updated dependencies [d32fc51]
- Updated dependencies [fa890ea]
- Updated dependencies [fa890ea]
- Updated dependencies [fa890ea]
  - @suigar/sdk@2.0.0-beta.31

## 1.0.0-beta.13

### Minor Changes

- eb9f060: Move each supported coin's price-info object ID into its coin metadata and remove the redundant `priceInfoObjectIds` configuration map.

### Patch Changes

- Updated dependencies [eb9f060]
  - @suigar/sdk@2.0.0-beta.30

## 1.0.0-beta.12

### Patch Changes

- 7f256b1: Keep the MCP server manifest's npm package version synchronized with the package version.

## 1.0.0-beta.11

### Patch Changes

- 04c9a54: Add MCP Registry metadata for package verification and discovery.

## 1.0.0-beta.10

### Minor Changes

- e3239d1: Add dedicated MCP App views for configuration, game metadata, transactions, and NFT browsing. Introduce the read-only `list_nfts` tool for the Suigar NFT catalog and a wallet's matching owned NFTs, including NFT images and display-friendly identifiers, and improve transaction gas formatting.

### Patch Changes

- e664f02: Expose `read_config` and `read_game_metadata` as standalone read-only MCP tools. `read_game_metadata` now requires one supported game and returns its live, cache-controllable on-chain parameters through `client.suigar.getGameParameters()`, including SDK-normalized float values and formatted atomic amount limits. MCP App support remains focused on transaction tools.
- Updated dependencies [e664f02]
- Updated dependencies [be697d7]
  - @suigar/sdk@2.0.0-beta.29

## 1.0.0-beta.9

### Patch Changes

- 373d636: Require an explicit game id when reading game metadata through the MCP tool and make the Codex plugin default prompts more explicit for reading config and game metadata.
- 09b6525: Ship a multi-client plugin bundle for installing the Suigar MCP server in Codex, Claude Code, Cursor, and Antigravity-style plugin hosts.
- 615cea7: Pin the bundled MCP server config of plugin to the package version from `package.json`.
- Updated dependencies [09b6525]
  - @suigar/sdk@2.0.0-beta.28

## 1.0.0-beta.8

### Patch Changes

- ba75a50: Clean up MCP runtime summary typing and scope React Doctor checks to the bundled MCP App.
- Updated dependencies [ba75a50]
  - @suigar/sdk@2.0.0-beta.27

## 1.0.0-beta.7

### Minor Changes

- 5085660: Upgrade the SDK and MCP package compatibility to the latest minor `@mysten/sui` release used by the workspace catalog.

### Patch Changes

- Updated dependencies [5085660]
  - @suigar/sdk@2.0.0-beta.26

## 1.0.0-beta.6

### Patch Changes

- 444436a: Update package compatibility with the latest supported Mysten libraries.
- a36cf76: Improve MCP transaction and dry-run summaries so structured values are formatted safely, and align inspector host-context handling with type-aware linting.
- Updated dependencies [444436a]
- Updated dependencies [a36cf76]
  - @suigar/sdk@2.0.0-beta.25

## 1.0.0-beta.5

### Major Changes

- 3c342f7: Align MCP server and app resource metadata with the MCP 2025-11-25 specification.

  Narrow the public package exports to the programmatic MCP server API from the package root. Internal runtime clients, schemas, tool handlers, runtime result types, app resource helpers, and the `./server` package subpath are no longer exported as public package APIs.

### Patch Changes

- 3c342f7: Ensure MCP tool handlers default omitted network inputs to testnet unless mainnet is explicitly requested.
- f1c285f: Align package compatibility with the latest supported Mysten libraries.
- Updated dependencies [f1c285f]
  - @suigar/sdk@2.0.0-beta.24

## 0.2.0-beta.4

### Patch Changes

- 9d97069: Update package repository and issue tracker metadata to point at the current ts-sdks repository.
- Updated dependencies [9d97069]
  - @suigar/sdk@2.0.0-beta.23

## 0.2.0-beta.3

### Patch Changes

- 9cc0a51: Update the MCP App build tooling to use the refreshed Vite dependency set.

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
