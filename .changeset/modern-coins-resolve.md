---
'@suigar/sdk': major
---

Rework SDK coin configuration and transaction bet coin handling.

- Replace `coinTypes` config with `coins` metadata containing `coinType` and `decimals` for each supported coin.
- Add `suigar({ config })` overrides for package ids, registry ids, supported coin metadata, and price info object ids.
- Rename `SuiNetwork` to `SuigarNetwork` and export `SuigarCoin` and `SuigarNetwork` from the package root.
- Rename `allowGasCoinShortcut` to `useGasCoin`.
- Use Mysten `coinWithBalance` transaction arguments for standard game and PvP coinflip bet coin construction.
- Convert the package config updater to TypeScript and run it through `tsx`.
