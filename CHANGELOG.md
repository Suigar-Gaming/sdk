# @suigar/sdk

## 2.0.0-beta.5

### Patch Changes

- bf98e0a: Update PvP coinflip registry lookups so `getPvPCoinflipGames()` can skip
  individual game resolution failures by default while still supporting
  `rejectOnError: true` for strict rejection.
  - Document the `rejectOnError` behavior in the public JSDoc and README examples.
  - Clarify repo guidance and skill documentation to distinguish general PvP game
    guidance from the current PvP coinflip-specific runtime surface.

## 2.0.0-beta.4

### Patch Changes

- 6daa819: Add BCS parser helpers and a Next.js game integration example app.
  - expose parser helpers through `@suigar/sdk/utils`
  - add `parseGameDetails` for decoding `BetResultEvent.game_details`
  - document generated BCS event decoding and game detail parsing guidance
  - add a testnet-only `examples/game-integration` app for standard and PvP Suigar transactions
  - integrate Mysten dApp Kit wallet connection, signing, and execution
  - add live transaction code previews and shared decoded event logging with SDK parser helpers
  - add Suigar-themed responsive UI, supported coin selection, and human-readable stake handling
  - update PvP coinflip join so callers only provide `gameId` and the SDK derives the join stake while using the configured price info object id

- b89d0b4: Add a public `@suigar/sdk/games` export subpath for shared game option types, and export `SuigarClient` from the package root.
- bf1f71b: Add `registryIds` to `SuigarConfig` and resolve it from the network config registry map.

  Document the PvP coinflip runtime helpers more clearly by describing
  registry-backed unresolved game discovery through `getPvPCoinflipGames()` and
  the normalized live-game lookup behavior of `resolvePvPConflipGame()`.

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
- Added transaction builders for `coinflip`, `limbo`, `plinko`, `range`, `wheel`, and PvP coinflip.
- Added dedicated exported transaction option types for standard and PvP game builders, including shared bet option helpers and `BuildGameOptions` aliases.
- Added generated contract bindings and BCS helpers, including `BetResultEvent` parsing support and PvP coinflip event BCS constructors for created, resolved, and cancelled events.
- Added configuration utilities for package IDs, coin types, and network-aware SDK setup.
- Expanded `SuigarClient` API documentation for transaction serialization, event decoding, and transaction builder helpers.
- Added build, test, typecheck, code generation, release, and npm publishing workflows.
- Added Changesets, ESLint, Prettier, Husky, and lint-staged for release management and code quality automation.
- Updated development dependencies for TypeScript and Vitest to their latest configured versions.
