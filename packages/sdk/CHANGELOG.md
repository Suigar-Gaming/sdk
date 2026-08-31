# @suigar/sdk

## 2.0.0-beta.41

### Patch Changes

- [#165](https://github.com/Suigar-Gaming/ts-sdks/pull/165) [`8ed7916`](https://github.com/Suigar-Gaming/ts-sdks/commit/8ed79163898711b1a8d5a9032ed27e59ba72e041) - Fix JSR publishing from the workspace release flow by staging publishable package sources with JSR-compatible dependency metadata.

## 2.0.0-beta.40

### Major Changes

- [#163](https://github.com/Suigar-Gaming/ts-sdks/pull/163) [`2897773`](https://github.com/Suigar-Gaming/ts-sdks/commit/28977730f01b8df72bced4c9ea4177c4dc420182) - Rename normalized event fields from `gameId` and `eventName` to `game` and `event`, add `parseSuigarEvent` for decoded event payloads and game details, expose `toU32` from SDK numeric utilities, and update MCP dry-run event summaries to expose `event`.

- [#159](https://github.com/Suigar-Gaming/ts-sdks/pull/159) [`e3c787b`](https://github.com/Suigar-Gaming/ts-sdks/commit/e3c787bf028c5f0bcce051077e8506d6605a16a6) - Narrow PvP Coinflip cancel transaction inputs so `cancelGame` no longer accepts `metadata` or `useGasCoin`, since cancellation does not create a bet coin or write metadata on-chain. The MCP cancel transaction tool schema now follows the same narrower shape.

### Minor Changes

- [#159](https://github.com/Suigar-Gaming/ts-sdks/pull/159) [`e3c787b`](https://github.com/Suigar-Gaming/ts-sdks/commit/e3c787bf028c5f0bcce051077e8506d6605a16a6) - Add Keno as a standard game across the SDK and MCP. The SDK now exposes Keno game types, parameter parsing, numeric and `vector<u8>` event detail decoding, and `client.suigar.tx.createGameBet({ game: 'keno', configId, picks, ... })`; MCP adds the `build_keno_transaction` tool with read-only, build, dry-run, and execute support. Parsed `u64` and `u128` game detail values now return `bigint` to preserve integer precision.

- [#163](https://github.com/Suigar-Gaming/ts-sdks/pull/163) [`2897773`](https://github.com/Suigar-Gaming/ts-sdks/commit/28977730f01b8df72bced4c9ea4177c4dc420182) - Add SweetHouse transaction builders for public pool deposits, redeem requests, and delayed self-claims under `client.suigar.tx.sweetHouse`, plus matching MCP tools for building, dry-running, inspecting, and executing those transactions.

### Patch Changes

- [#161](https://github.com/Suigar-Gaming/ts-sdks/pull/161) [`b0119c2`](https://github.com/Suigar-Gaming/ts-sdks/commit/b0119c2b78f02a939cb125415524a33e2dde6792) - Add JSR package configuration so public Suigar packages can be published to JSR alongside npm releases.

- [#162](https://github.com/Suigar-Gaming/ts-sdks/pull/162) [`17a2808`](https://github.com/Suigar-Gaming/ts-sdks/commit/17a2808883143f7e0ee1e96ec311331d218bf31c) - Update the generated Keno bindings and package registry default to resolve Keno through the `@suigar/keno` MVR package name.

- [#159](https://github.com/Suigar-Gaming/ts-sdks/pull/159) [`e3c787b`](https://github.com/Suigar-Gaming/ts-sdks/commit/e3c787bf028c5f0bcce051077e8506d6605a16a6) - Enable Oxfmt JSDoc formatting and Tailwind CSS class sorting, normalize package comments and class lists, and opt generated contract files out of JSDoc and import sorting to preserve their generated warning banners without changing runtime APIs.

## 2.0.0-beta.39

### Minor Changes

- [#158](https://github.com/Suigar-Gaming/ts-sdks/pull/158) [`e82da77`](https://github.com/Suigar-Gaming/ts-sdks/commit/e82da77a0b0b2d937b8396a48c7a0a396f17ac3e) - Treat non-positive `cacheTtl` values as disabling SDK-managed game parameter caching and route TTL cache reads through a shared internal cache helper.

  Add `SuigarClient.reset()` to clear cached SDK reads for the extension instance.

- [#157](https://github.com/Suigar-Gaming/ts-sdks/pull/157) [`77a9247`](https://github.com/Suigar-Gaming/ts-sdks/commit/77a924767bc68edaeb8c8c0470a916a86e679504) - Use generated MVR package defaults for Suigar game, referral, and core bindings while keeping optional package id overrides for deployments that need them. `nftV1` remains the only statically configured package id. Game parameter settings lookup and PvP Coinflip registry lookup now also respect overridden game package ids.

## 2.0.0-beta.38

### Patch Changes

- [#152](https://github.com/Suigar-Gaming/ts-sdks/pull/152) [`2496c29`](https://github.com/Suigar-Gaming/ts-sdks/commit/2496c29fc18fb6e91e5f21609b5f9c1b2d3e2b12) - Reformat package sources with Oxfmt without changing runtime APIs.

## 2.0.0-beta.37

### Major Changes

- [#147](https://github.com/Suigar-Gaming/ts-sdks/pull/147) [`0444640`](https://github.com/Suigar-Gaming/ts-sdks/commit/0444640b69aa7f3efa8e75adf90387ed181f8d68) - Convert public SDK helpers, including `createGameBet`, to single options object signatures for Mysten-style calls.

  Update MCP transaction and read tooling to call the new SDK object signatures.

### Patch Changes

- [#150](https://github.com/Suigar-Gaming/ts-sdks/pull/150) [`22b810f`](https://github.com/Suigar-Gaming/ts-sdks/commit/22b810f2208c9165cca3131d081d145a187c2cb8) - Refactor the internal on-chain game parameters registry type for clearer SDK game settings definitions.

- [#149](https://github.com/Suigar-Gaming/ts-sdks/pull/149) [`a4a3772`](https://github.com/Suigar-Gaming/ts-sdks/commit/a4a377257285446714d73f0b3cb66b79671b7cac) - Keep NFT V1 mint and PvP Coinflip join transaction builders responsible for resolving their own payment coins from the configured client.

## 2.0.0-beta.36

### Patch Changes

- 0ef83b8: Refresh SDK and MCP discovery text with Suigar casino, AI agent, Sui, NFT, and referral keywords.

## 2.0.0-beta.35

### Patch Changes

- d166e67: Refresh SDK dependency metadata for the latest Mysten package catalog updates.

## 2.0.0-beta.34

### Patch Changes

- 37d17de: Update SDK and MCP compatibility with the latest patch release of the shared `@mysten/sui` dependency.

## 2.0.0-beta.33

### Minor Changes

- ab6bab9: Add a configured NFT V1 mint transaction builder that mints directly to the sender.

## 2.0.0-beta.32

### Major Changes

- 5f53b3f: Reorganize the client extension transaction API. Rename `client.suigar.tx.createBetTransaction(game, options)` to `client.suigar.tx.createGameBet(game, options)`, and replace `createPvPCoinflipTransaction(action, options)` with action-specific `client.suigar.tx.pvpCoinflip.createGame(options)`, `.joinGame(options)`, and `.cancelGame(options)` builders. Rename public transaction option types to reflect their game or action inputs, including `CreateGameBetOptions`, `RangeTransactionOptions`, and the PvP Coinflip transaction option types.

### Minor Changes

- 3335aa7: Add composable and complete referrer commission and level-up USD reward claim transactions.

  Add referral commission and level-up USD reward reads plus unsigned claim transaction builders.

- e029500: Refresh compatibility with the latest supported Mysten Sui libraries.

### Patch Changes

- 9a7d55f: Standardize internal array type annotations for TypeScript consistency.
- 3335aa7: Clarify that `getGameParameters` requires a coin type when loading coin-specific game parameters.

## 2.0.0-beta.31

### Major Changes

- fa890ea: Rename the NFT configuration and BCS APIs from legacy names to NFT V1 names, and generate the NFT V1 decoding bindings from the on-chain package.
- fa890ea: Split singleton object ids into `config.objectIds`, leaving only Move package addresses in `config.packageIds`; `sweetHouse` and `legacyNftFactory` move to `config.objectIds`. Network configuration files now use consistent package, object, registry, and coin modules.

### Minor Changes

- fa890ea: Add Soccer generated bindings, parameters, event detail parsing, and standard game transaction building through `createBetTransaction('soccer', ...)`.

### Patch Changes

- d32fc51: Refresh Mysten and build-tool dependency metadata.
- fa890ea: Narrow `SuigarGameEvent` so standard games only pair with `BetResultEvent`, while PvP games support all recognized event names.

## 2.0.0-beta.30

### Minor Changes

- eb9f060: Move each supported coin's price-info object ID into its coin metadata and remove the redundant `priceInfoObjectIds` configuration map.

## 2.0.0-beta.29

### Minor Changes

- e664f02: Load game parameters with fewer network calls by retrieving the game settings field ID without fetching its object. Export `isMoveFloat` and `isMoveI64` from `@suigar/sdk/utils`, and return Move float parameter fields as JavaScript numbers, including multipliers nested in game configs.
- be697d7: Expose network-resolved legacy NFT package and factory object ids, plus BCS helpers for decoding legacy NFT factory and owned NFT objects.

## 2.0.0-beta.28

### Patch Changes

- 09b6525: Add package author metadata to the SDK package manifest.

## 2.0.0-beta.27

### Patch Changes

- ba75a50: Tighten transaction builder validation around typed transaction data.

## 2.0.0-beta.26

### Minor Changes

- 5085660: Upgrade the SDK and MCP package compatibility to the latest minor `@mysten/sui` release used by the workspace catalog.

## 2.0.0-beta.25

### Patch Changes

- 444436a: Update package compatibility with the latest supported Mysten libraries.
- a36cf76: Harden SDK numeric error formatting for unusual invalid values and keep async TTL cache refresh behavior explicit under type-aware linting.

## 2.0.0-beta.24

### Patch Changes

- f1c285f: Align package compatibility with the latest supported Mysten libraries.

## 2.0.0-beta.23

### Patch Changes

- 9d97069: Update package repository and issue tracker metadata to point at the current ts-sdks repository.

## 2.0.0-beta.22

### Major Changes

- 802e082: Rework SDK coin configuration and transaction bet coin handling.

  - Replace `coinTypes` config with `coins` metadata containing `coinType` and `decimals` for each supported coin.
  - Add `suigar({ config })` overrides for package ids, registry ids, supported coin metadata, and price info object ids.
  - Rename `SuiNetwork` to `SuigarNetwork` and export `SuigarCoin` and `SuigarNetwork` from the package root.
  - Rename `allowGasCoinShortcut` to `useGasCoin`.
  - Use Mysten `coinWithBalance` transaction arguments for standard game and PvP Coinflip bet coin construction.
  - Leave `useGasCoin` undefined unless the caller explicitly configures it, so Mysten's coin intent helpers apply their default behavior.
  - Convert the package config updater to TypeScript and run it through `tsx`.

### Minor Changes

- 4923f91: Rename the supported coin metadata registry type to `SuigarCoinRegistry`.
- d597399: Expose shared game ids, game id types, PvP action types, and supported Sui network constants from public SDK entrypoints for typed integrations such as `@suigar/mcp`.

### Patch Changes

- d597399: Fix the public `createPvPCoinflipTransaction` option type so callers do not need to provide the SDK-internal config object.

## 2.0.0-beta.21

### Patch Changes

- e524cd1: Refresh SDK dependency metadata for the latest Mysten package catalog updates.

## 2.0.0-beta.20

### Minor Changes

- 84feb08: Refresh SDK dependency metadata for the latest Mysten package set and normalize the published Node engine range.
- bed0775: Update the SDK to the latest Mysten package set, NodeNext TypeScript module resolution, and explicit ESM source imports. Regenerated contract wrappers now expose helpers for building and resolving Move type tags from generated BCS types.

## 2.0.0-beta.19

### Minor Changes

- 10f49e2: Bump the SDK's `@mysten/sui` dependency to the latest shared workspace minor release and align the package metadata and lockfile with that update.

## 2.0.0-beta.18

### Patch Changes

- de9e425: Update SDK dependency metadata to use the shared Mysten and TypeScript pnpm catalogs, including the `@mysten/sui` and `tsx` dependency updates.

## 2.0.0-beta.17

### Major Changes

- bd8499e: Rename transaction builder option `playerAddress` to `owner` across standard and PvP transaction APIs.

## 2.0.0-beta.16

### Patch Changes

- 4463bbf: Update `@mysten/*` dependencies to latest patch versions

## 2.0.0-beta.15

### Patch Changes

- 67a8b5b: Add `parseGameEvent` to `@suigar/sdk/utils` for extracting a normalized Suigar game id plus raw Move event name for supported Suigar events in `GAME_EVENTS`, including standard `BetResultEvent` and PvP Coinflip events.

  Change `parseGameDetails` to accept `gameId` first so TypeScript can narrow the returned detail keys and value types per game.

## 2.0.0-beta.14

### Patch Changes

- f846d27: Rename exported SDK config types to distinguish key unions from ID maps more clearly.
  - Rename `SuigarPackageKey` to `SuigarPackage`.
  - Rename the old `SuigarPackage` record type to `SuigarPackageIds`.
  - Rename `SuigarRegistryKey` to `SuigarRegistry`.
  - Rename the old `SuigarRegistry` record type to `SuigarRegistryIds`.
  - Rename `SuigarPriceInfoObjectId` to `SuigarPriceInfoObjectIds`.

## 2.0.0-beta.13

### Patch Changes

- 667d7c4: Normalize repository wording to use `on-chain` consistently.

## 2.0.0-beta.12

### Patch Changes

- 85ae057: Refine public validation failures to use `RangeError` and `TypeError` instead of generic `Error` for unsupported networks, unsupported game or PvP action inputs, unsupported configured coin types, bounded integer helpers, and `parseCoinType()` parsing failures.

## 2.0.0-beta.11

### Patch Changes

- c7685d2: Add `client.suigar.getGameParameters(game, options?)` for reading live on-chain game parameter objects, such as min/max stake and game-specific config bounds, directly from SweetHouse settings.

  The lookup first reads the selected game's settings object from SweetHouse, then reads that game's coin-specific `Parameters<T>` object, parses it with the correct return type for the requested game, and caches the result for SDK integrations that need to display or validate current game limits without repeatedly querying the same on-chain objects.

  This update also broadens the public numeric helpers in `@suigar/sdk/utils`: `toBigInt()` accepts booleans and non-negative integer strings in addition to numbers and `bigint`, `toU8()` accepts plain integer strings such as `'1'` for parsed config ids and other `u8` values, and `toU16()` provides the same validation pattern for `u16` values.

## 2.0.0-beta.10

### Patch Changes

- 4b59c7b: Remove the `client.suigar.resolvePvPCoinflipGame()` client method. Use the exported generated helper `client.suigar.bcs.PvPCoinflipGame.get({ client, objectId })` for one specific live PvP Coinflip game object instead.

  Add `parseCoinType` to `@suigar/sdk/utils` for extracting normalized coin types from generic Move object type strings.

- 4b59c7b: Move the SDK into the `packages/sdk` pnpm workspace while keeping the public package API unchanged.

## 2.0.0-beta.9

### Patch Changes

- eaf8b3a: Fix metadata encoding so partner metadata is only added when configured and hex metadata values are encoded consistently as bytes. Improve supported-coin and price-info resolution error handling for transaction configuration.
- 9929e05: Refine Move parser helpers by simplifying BCS type usage, normalizing missing `i64` and float mantissa values to `0`, and documenting the numeric conversion behavior in `fromMoveI64` and `fromMoveFloat`.

## 2.0.0-beta.8

### Patch Changes

- 0292edb: Rename transaction builder option `owner` to `playerAddress` and remove the separate `sender` option so all game transactions use a single explicit player address.
- 20311be: Improve the public JSDoc for `parseGameDetails`, `toBigInt`, and `toU8` so the generated API surface explains their coercion, validation, and decoding behavior more clearly.
- a2aa324: Update PvP Coinflip lookup helpers to use bulk object reads for unresolved lobby discovery and support forwarded lookup options.
  - Make `getPvPCoinflipGames()` parse bulk `client.core.getObjects()` results instead of resolving each game individually.
  - Skip per-object fetch or parse failures by default and continue supporting strict rejection with `throwOnError: true`.
  - Forward supported lookup options such as `signal` through `getPvPCoinflipGames()` and `resolvePvPCoinflipGame(gameId, options?)`.
  - Update tests, README guidance, and repo-local PvP skill documentation to match the current client behavior.

## 2.0.0-beta.7

### Patch Changes

- f0ea104: Align numeric utility names, Move decoding helpers, and PvP BCS event helper references with the current SDK API.

## 2.0.0-beta.6

### Patch Changes

- ef6bcd4: Rename getPvPCoinflipGames option from rejectOnError to throwOnError.

## 2.0.0-beta.5

### Patch Changes

- bf98e0a: Update PvP Coinflip registry lookups so `getPvPCoinflipGames()` can skip individual game resolution failures by default while still supporting `rejectOnError: true` for strict rejection.
  - Document the `rejectOnError` behavior in the public JSDoc and README examples.
  - Clarify repo guidance and skill documentation to distinguish general PvP game guidance from the current PvP Coinflip-specific runtime surface.

## 2.0.0-beta.4

### Patch Changes

- 6daa819: Add BCS parser helpers and a Next.js playground example app.
  - expose parser helpers through `@suigar/sdk/utils`
  - add `parseGameDetails` for decoding `BetResultEvent.game_details`
  - document generated BCS event decoding and game detail parsing guidance
  - add a testnet-only app for standard and PvP Suigar transactions
  - integrate Mysten dApp Kit wallet connection, signing, and execution
  - add live transaction code previews and shared decoded event logging with SDK parser helpers
  - add Suigar-themed responsive UI, supported coin selection, and human-readable stake handling
  - update PvP Coinflip join so callers only provide `gameId` and the SDK derives the join stake while using the configured price info object id

- b89d0b4: Add a public `@suigar/sdk/games` export subpath for shared game option types, and export `SuigarClient` from the package root.
- bf1f71b: Add `registryIds` to `SuigarConfig` and resolve them from the network config registry map.

  Document the PvP Coinflip runtime helpers more clearly by describing registry-backed unresolved game discovery through `getPvPCoinflipGames()` and the normalized live-game lookup behavior of `resolvePvPCoinflipGame()`.

- 4861f55: Add public utility exports for shared scaling constants in `@suigar/sdk/utils`, including `RANGE_POINT_LIMIT` and `DEFAULT_RANGE_SCALE`. Update the SDK example app and documentation to use the exported constants and document limbo/range scaling behavior more clearly.

## 2.0.0-beta.3

### Patch Changes

- e1cdedc: Improve public transaction builder typings and refresh Sui 2.0+ integration guidance around the gRPC client.
  - Fix exported transaction option types so `BuildGameOptions` and `BuildPvPGameOptions` no longer require the internal `config` field
  - Update installation and integration documentation for Sui 2.0+ by switching examples to `SuiGrpcClient`, clarifying required peer dependencies, and aligning transaction-result examples with the current client API.

## 2.0.0-beta.2

### Patch Changes

- 128cb6c: Make SDK configuration network-resolved and expose runtime config inspection through the client extension.
  - `suigar()` now only accepts the extension `name`.
  - The SDK now validates the connected client network and supports `mainnet` and `testnet`.
  - Added `client.suigar.getConfig()` to inspect the resolved network config at runtime.
  - Exported the `SuiNetwork` type and `resolveGamePackageId()` helper.
  - Reworked `SuigarConfig` into a network-resolved structure with `packageIds`, `coinTypes`, and `priceInfoObjectIds`.
  - Replaced the old Pyth-specific price object resolution flow with supported-coin-based `priceInfoObjectId` resolution.
  - Split package and coin configuration into explicit `mainnet` and `testnet` maps and updated transaction builders to use the new structure.
  - Updated generated event helpers, tests, and documentation to match the new configuration and event parsing flow.

  Notes:
  - Existing prerelease integrations using `suigar({ ...configOverrides })` will need to migrate to `suigar()`.
  - Runtime config inspection should now use `client.suigar.getConfig()`.

## 2.0.0-beta.1

### Patch Changes

- Updated the npm release workflows to install dependencies without a committed lockfile and removed the obsolete Node.js cache configuration.
- Simplified previous-release deprecation logic so prerelease publishes do not attempt to deprecate earlier npm versions.
- Stopped tracking `package-lock.json` and removed the obsolete changeset file after the version bump.

## 2.0.0-beta.0

### Major Changes

- Initial release of `@suigar/sdk`, a TypeScript SDK for building Suigar v2 game transactions on Sui.
- Added the `suigar()` client extension to public API.
- Added transaction builders for `coinflip`, `limbo`, `plinko`, `range`, `wheel`, and PvP Coinflip.
- Added dedicated exported transaction option types for standard and PvP game builders, including shared bet option helpers and `BuildGameOptions` aliases.
- Added generated contract bindings and BCS helpers, including `BetResultEvent` parsing support and PvP Coinflip event BCS constructors for created, resolved, and cancelled events.
- Added configuration utilities for package IDs, coin types, and network-aware SDK setup.
- Expanded `SuigarClient` API documentation for transaction serialization, event decoding, and transaction builder helpers.
- Added build, test, typecheck, code generation, release, and npm publishing workflows.
- Added Changesets, ESLint, Prettier, Husky, and lint-staged for release management and code quality automation.
- Updated development dependencies for TypeScript and Vitest to their latest configured versions.
