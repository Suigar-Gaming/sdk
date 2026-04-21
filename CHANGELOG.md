# @suigar/sdk

## 2.0.0-beta.0

### Major Changes

- Initial release of `@suigar/sdk`, a TypeScript SDK for building Suigar v2 game transactions on Sui.
- Added the `suigar()` client extension and `SuigarClient` public API.
- Added transaction builders for `coinflip`, `limbo`, `plinko`, `range`, `wheel`, and PvP coinflip.
- Added dedicated exported transaction option types for standard and PvP game builders, including shared bet option helpers and `BuildGameOptions` aliases.
- Added generated contract bindings and BCS helpers, including `BetResultEvent` parsing support and PvP coinflip event BCS constructors for created, resolved, and cancelled events.
- Added configuration utilities for package IDs, coin types, and network-aware SDK setup.
- Expanded `SuigarClient` API documentation for transaction serialization, event decoding, and transaction builder helpers.
- Refactored transaction builders to import their option types from the public `src/types` surface instead of defining them inline.
- Renamed PvP coinflip event constructor accessors on `SuigarClient.bcs` for clearer, more consistent naming.
- Added build, test, typecheck, code generation, release, and npm publishing workflows.
- Added Changesets, ESLint, Prettier, Husky, and lint-staged for release management and code quality automation.
- Updated development dependencies for TypeScript and Vitest to their latest configured versions.
