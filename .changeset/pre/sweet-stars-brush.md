---
'@suigar/sdk': patch
---

Make SDK configuration network-resolved and expose runtime config inspection through the client extension.

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
