# @suigar/sdk

## 2.0.0-beta.3

### Patch Changes

- e1cdedc: - Fix exported transaction option types so `BuildGameOptions` and `BuildPvPGameOptions` no longer require the internal `config` field
  - Update installation and integration documentation for Sui 2.0+ by switching examples to `SuiGrpcClient`, clarifying required peer dependencies, and aligning transaction-result examples with the current client API.

## 2.0.0-beta.2

### Patch Changes

- 128cb6c: - `suigar()` now only accepts the extension `name`.
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
