---
'@suigar/sdk': major
---

Use Mysten `coinWithBalance` intents for bet coin construction, rename `allowGasCoinShortcut` to `useGasCoin`, and replace `coinTypes` config with supported `sui`/`usdc` coin metadata plus extension config overrides. The package config updater now runs as a TypeScript script through `tsx` and emits the new coin metadata config shape.
