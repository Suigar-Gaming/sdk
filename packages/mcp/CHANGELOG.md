# @suigar/mcp

## 1.0.0-beta.26

### Major Changes

- [#163](https://github.com/Suigar-Gaming/ts-sdks/pull/163) [`2897773`](https://github.com/Suigar-Gaming/ts-sdks/commit/28977730f01b8df72bced4c9ea4177c4dc420182) - Rename normalized event fields from `gameId` and `eventName` to `game` and `event`, add `parseSuigarEvent` for decoded event payloads and game details, expose `toU32` from SDK numeric utilities, and update MCP dry-run event summaries to expose `event`.

- [#159](https://github.com/Suigar-Gaming/ts-sdks/pull/159) [`e3c787b`](https://github.com/Suigar-Gaming/ts-sdks/commit/e3c787bf028c5f0bcce051077e8506d6605a16a6) - Narrow PvP Coinflip cancel transaction inputs so `cancelGame` no longer accepts `metadata` or `useGasCoin`, since cancellation does not create a bet coin or write metadata on-chain. The MCP cancel transaction tool schema now follows the same narrower shape.

### Minor Changes

- [#159](https://github.com/Suigar-Gaming/ts-sdks/pull/159) [`e3c787b`](https://github.com/Suigar-Gaming/ts-sdks/commit/e3c787bf028c5f0bcce051077e8506d6605a16a6) - Add Keno as a standard game across the SDK and MCP. The SDK now exposes Keno game types, parameter parsing, numeric and `vector<u8>` event detail decoding, and `client.suigar.tx.createGameBet({ game: 'keno', configId, picks, ... })`; MCP adds the `build_keno_transaction` tool with read-only, build, dry-run, and execute support. Parsed `u64` and `u128` game detail values now return `bigint` to preserve integer precision.

- [#163](https://github.com/Suigar-Gaming/ts-sdks/pull/163) [`2897773`](https://github.com/Suigar-Gaming/ts-sdks/commit/28977730f01b8df72bced4c9ea4177c4dc420182) - Add SweetHouse transaction builders for public pool deposits, redeem requests, and delayed self-claims under `client.suigar.tx.sweetHouse`, plus matching MCP tools for building, dry-running, inspecting, and executing those transactions.

### Patch Changes

- [#164](https://github.com/Suigar-Gaming/ts-sdks/pull/164) [`693f299`](https://github.com/Suigar-Gaming/ts-sdks/commit/693f299d9ee7eab453d2e06849ff9bf36ede6b4e) - Use Noble Ciphers’ portable byte utilities for MCP wallet bridge state, request IDs, and session-wallet identifiers, with Node’s native timing-safe byte comparison used when available and Noble’s portable fallback elsewhere. Prefer Web Crypto UUIDs with a Noble-backed v4 fallback.

- [#161](https://github.com/Suigar-Gaming/ts-sdks/pull/161) [`b0119c2`](https://github.com/Suigar-Gaming/ts-sdks/commit/b0119c2b78f02a939cb125415524a33e2dde6792) - Add JSR package configuration so public Suigar packages can be published to JSR alongside npm releases.

- [#159](https://github.com/Suigar-Gaming/ts-sdks/pull/159) [`e3c787b`](https://github.com/Suigar-Gaming/ts-sdks/commit/e3c787bf028c5f0bcce051077e8506d6605a16a6) - Refactor the bundled MCP App to use the ext-apps React hooks for host connection lifecycle and host styling.

- [#164](https://github.com/Suigar-Gaming/ts-sdks/pull/164) [`693f299`](https://github.com/Suigar-Gaming/ts-sdks/commit/693f299d9ee7eab453d2e06849ff9bf36ede6b4e) - Replace session wallet QR generation with the zero-dependency `qr` encoder while preserving the MCP App funding QR data URL output.

- [#159](https://github.com/Suigar-Gaming/ts-sdks/pull/159) [`e3c787b`](https://github.com/Suigar-Gaming/ts-sdks/commit/e3c787bf028c5f0bcce051077e8506d6605a16a6) - Enable Oxfmt JSDoc formatting and Tailwind CSS class sorting, normalize package comments and class lists, and opt generated contract files out of JSDoc and import sorting to preserve their generated warning banners without changing runtime APIs.

- [#164](https://github.com/Suigar-Gaming/ts-sdks/pull/164) [`693f299`](https://github.com/Suigar-Gaming/ts-sdks/commit/693f299d9ee7eab453d2e06849ff9bf36ede6b4e) - Tighten MCP transaction tool schemas so build, dry-run, and execute modes reject missing SDK-required transaction fields while still allowing read-only planning. Validate SweetHouse redeem request IDs, PvP Coinflip game IDs, and NFT specification IDs as Sui object IDs.
- Updated dependencies [[`2897773`](https://github.com/Suigar-Gaming/ts-sdks/commit/28977730f01b8df72bced4c9ea4177c4dc420182), [`b0119c2`](https://github.com/Suigar-Gaming/ts-sdks/commit/b0119c2b78f02a939cb125415524a33e2dde6792), [`17a2808`](https://github.com/Suigar-Gaming/ts-sdks/commit/17a2808883143f7e0ee1e96ec311331d218bf31c), [`e3c787b`](https://github.com/Suigar-Gaming/ts-sdks/commit/e3c787bf028c5f0bcce051077e8506d6605a16a6), [`e3c787b`](https://github.com/Suigar-Gaming/ts-sdks/commit/e3c787bf028c5f0bcce051077e8506d6605a16a6), [`e3c787b`](https://github.com/Suigar-Gaming/ts-sdks/commit/e3c787bf028c5f0bcce051077e8506d6605a16a6), [`2897773`](https://github.com/Suigar-Gaming/ts-sdks/commit/28977730f01b8df72bced4c9ea4177c4dc420182)]:
  - @suigar/sdk@2.0.0-beta.40

## 1.0.0-beta.25

### Patch Changes

- [#155](https://github.com/Suigar-Gaming/ts-sdks/pull/155) [`3a9391f`](https://github.com/Suigar-Gaming/ts-sdks/commit/3a9391f90687c7dde76da23c6fc77bc7a2c9e0bd) - Update the MCP package dependencies: `open` and `react-doctor`

- [#157](https://github.com/Suigar-Gaming/ts-sdks/pull/157) [`77a9247`](https://github.com/Suigar-Gaming/ts-sdks/commit/77a924767bc68edaeb8c8c0470a916a86e679504) - Allow MCP read-only plans and transaction summaries to work with SDK configs that use MVR-backed package defaults instead of concrete package ids. Transaction summaries also preserve configured gas budget inputs as raw MIST plus SUI display values.
- Updated dependencies [[`e82da77`](https://github.com/Suigar-Gaming/ts-sdks/commit/e82da77a0b0b2d937b8396a48c7a0a396f17ac3e), [`77a9247`](https://github.com/Suigar-Gaming/ts-sdks/commit/77a924767bc68edaeb8c8c0470a916a86e679504)]:
  - @suigar/sdk@2.0.0-beta.39

## 1.0.0-beta.24

### Patch Changes

- [#152](https://github.com/Suigar-Gaming/ts-sdks/pull/152) [`2496c29`](https://github.com/Suigar-Gaming/ts-sdks/commit/2496c29fc18fb6e91e5f21609b5f9c1b2d3e2b12) - Reformat package sources with Oxfmt without changing runtime APIs.
- Updated dependencies [[`2496c29`](https://github.com/Suigar-Gaming/ts-sdks/commit/2496c29fc18fb6e91e5f21609b5f9c1b2d3e2b12)]:
  - @suigar/sdk@2.0.0-beta.38

## 1.0.0-beta.23

### Patch Changes

- [#147](https://github.com/Suigar-Gaming/ts-sdks/pull/147) [`0444640`](https://github.com/Suigar-Gaming/ts-sdks/commit/0444640b69aa7f3efa8e75adf90387ed181f8d68) - Convert public SDK helpers, including `createGameBet`, to single options object signatures for Mysten-style calls.

  Update MCP transaction and read tooling to call the new SDK object signatures.

- Updated dependencies [[`22b810f`](https://github.com/Suigar-Gaming/ts-sdks/commit/22b810f2208c9165cca3131d081d145a187c2cb8), [`a4a3772`](https://github.com/Suigar-Gaming/ts-sdks/commit/a4a377257285446714d73f0b3cb66b79671b7cac), [`0444640`](https://github.com/Suigar-Gaming/ts-sdks/commit/0444640b69aa7f3efa8e75adf90387ed181f8d68)]:
  - @suigar/sdk@2.0.0-beta.37

## 1.0.0-beta.22

### Patch Changes

- 0ef83b8: Refresh SDK and MCP discovery text with Suigar casino, AI agent, Sui, NFT, and referral keywords.
- Updated dependencies [0ef83b8]
  - @suigar/sdk@2.0.0-beta.36

## 1.0.0-beta.21

### Minor Changes

- 39ba3db: Add named local session wallet support across MCP wallet, balance, coin, and execute-mode game tools, including wallet IDs in session-wallet setup, lookup, funding, and transaction execution flows.

  Start paired-wallet login and logout from MCP tools through the local `npx -y @suigar/mcp` CLI flows so browser-mediated wallet pairing opens the selected network automatically.

  Make local browser origins, bridge timeout, callback body-size limits, and session-wallet setup expiration configurable with `SUIGAR_MCP_BRIDGE_WEB_URL`, `SUIGAR_MCP_BRIDGE_TIMEOUT_MS`, `SUIGAR_MCP_BRIDGE_MAX_BODY_BYTES`, `SUIGAR_MCP_SESSION_SETUP_TIMEOUT_MS`, `--web-url`, `--timeout-ms`, and `--max-body-bytes`, and have bridge creation open its URL by default unless disabled.

  Open both mainnet and testnet browser logout pages for `logout --all` when using the default Suigar web origins.

  Update MCP package metadata and remove the static CLI tool catalog in favor of MCP protocol tool discovery.

  Wire the CLI `--version` output to the bundled MCP package version.

  Share MCP amount field metadata across dry-run event formatting and game-parameter formatting.

### Patch Changes

- d166e67: Use the Mysten core client API for SuiNS owner address resolution in transaction builders.
- Updated dependencies [d166e67]
  - @suigar/sdk@2.0.0-beta.35

## 1.0.0-beta.20

### Patch Changes

- bb4e190: Publish the server manifest under the authorized Suigar-Gaming MCP Registry namespace.

## 1.0.0-beta.19

### Patch Changes

- 09043aa: Keep the MCP Registry manifest description within the registry validation limit.

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

- 5f53b3f: Reorganize the client extension transaction API. Rename `client.suigar.tx.createBetTransaction(game, options)` to `client.suigar.tx.createGameBet(game, options)`, and replace `createPvPCoinflipTransaction(action, options)` with action-specific `client.suigar.tx.pvpCoinflip.createGame(options)`, `.joinGame(options)`, and `.cancelGame(options)` builders. Rename public transaction option types to reflect their game or action inputs, including `CreateGameBetOptions`, `RangeTransactionOptions`, and the PvP Coinflip transaction option types.

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
  - Add MCP tools for building and dry-running on-chain transactions for coinflip, limbo, plinko, range, wheel, and PvP Coinflip.
  - Add shared MCP support metadata so clients can distinguish on-chain games from unsupported backend-driven games such as slots.
  - Add transaction serialization helpers, read-only Sui client setup, stdio server entrypoint, tests, and README usage guidance.
