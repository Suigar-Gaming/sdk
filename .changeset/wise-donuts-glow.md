---
'@suigar/sdk': patch
---

Rename exported SDK config types to distinguish key unions from ID maps more clearly.

- Rename `SuigarPackageKey` to `SuigarPackage`.
- Rename the old `SuigarPackage` record type to `SuigarPackageIds`.
- Rename `SuigarRegistryKey` to `SuigarRegistry`.
- Rename the old `SuigarRegistry` record type to `SuigarRegistryIds`.
- Rename `SuigarPriceInfoObjectId` to `SuigarPriceInfoObjectIds`.
