---
'@suigar/sdk': minor
---

Add BCS parser helpers and a Next.js game integration example app.

- expose parser helpers through `@suigar/sdk/utils`
- add `parseGameDetails` for decoding `BetResultEvent.game_details`
- document generated BCS event decoding and game detail parsing guidance
- add a testnet-only `examples/game-integration` app for standard and PvP Suigar transactions
- integrate Mysten dApp Kit wallet connection, signing, and execution
- add live transaction code previews and shared decoded event logging with SDK parser helpers
- add Suigar-themed responsive UI, supported coin selection, and human-readable stake handling
