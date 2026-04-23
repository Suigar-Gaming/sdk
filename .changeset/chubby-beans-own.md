---
'@suigar/sdk': patch
---

Add a Next.js game integration example app.

- add a testnet-only `examples/game-integration` app for standard and PvP Suigar transactions
- integrate Mysten dApp Kit wallet connection, signing, and execution
- add live transaction code previews and shared decoded event logging
- expose parser helpers through `@suigar/sdk/utils` and use them to format oracle prices in the example event table
- add Suigar-themed responsive UI, supported coin selection, and human-readable stake handling
