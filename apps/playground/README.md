# `@suigar/playground`

Next.js example app for the Suigar SDK. It uses:

- `@suigar/sdk`
- `@suigar/sdk/games`
- `@suigar/sdk/utils`
- `@mysten/dapp-kit-core`
- `@mysten/dapp-kit-react`
- `@mysten/sui`
- Suigar-inspired UI and theme tokens based on the frontend app

## What it covers

The example reflects the current package export split:

- runtime integration through `@suigar/sdk`
- game option types through `@suigar/sdk/games`
- parsing helpers through `@suigar/sdk/utils`

- Standard game route: `/standard?game=coinflip`
- PvP route: `/pvp?game=pvp-coinflip&action=create`
- Query-param game selection
- Shared supported-coin selector using `client.suigar.getConfig().coinTypes`
- Connected-wallet balance cards for every supported coin type
- Per-game form components for standard and PvP Coinflip flows
- Standard game forms backed by `client.suigar.getGameParameters()` for live on-chain stake ranges, per-game parameter bounds, and Plinko/Wheel config selection
- A game-settings dialog in the standard controls card that shows the current typed `getGameParameters()` result, available configs, selected config, lookup request, and raw payload
- PvP game selection scaffolded through a dedicated selector, with `pvp-coinflip` as the first option
- Join and cancel lobby cards backed by `client.suigar.getPvPCoinflipGames()`, with public join lobbies visible while disconnected, an optional private-lobby join toggle, connected-wallet filtering for cancel, compact multi-column cards, creator-side labels, privacy badges, and copyable game ids
- Live transaction-builder code preview
- A dedicated execute-transaction card that reads the connected wallet state directly from the new Mysten dApp Kit
- Decoding of `BetResultEvent`, `PvPCoinflipGameCreatedEvent`, `PvPCoinflipGameResolvedEvent`, and `PvPCoinflipGameCancelledEvent`
- Oracle price formatting with `fromMoveFloat` and game detail decoding with `parseGameDetails` from `@suigar/sdk/utils`
- Shared persistent event table across route and game changes

## Run it

From the repository root:

```bash
pnpm install
pnpm turbo run dev --filter='./apps/playground'
```

Then open [http://localhost:3000](http://localhost:3000).

The playground resolves the workspace-local `@suigar/sdk` package through `workspace:^`. Use the root Turbo commands when you want the SDK dependency graph built first with `build:ci` before the app command starts.

Useful local checks:

```bash
pnpm --dir apps/playground format
pnpm --dir apps/playground lint
pnpm turbo run typecheck --filter='./apps/playground'
```

## Notes

- The app is fixed to `testnet`.
- Connected balances are fetched from the active wallet for each SDK-supported coin type and refresh after transaction execution.
- Stake inputs use human values such as `1` or `2.5` and are converted to atomic on-chain units before transaction creation where the selected action requires a stake.
- Standard game stake fields show the current on-chain min and max range for the selected coin, and the form clamps stake back into the allowed range when live parameters load or change.
- Limbo also clamps `targetMultiplier` to the on-chain `min_target_multiplier` and `max_target_multiplier` bounds. Those fields are generated Move float structs, so the playground parses them with `fromMoveFloat()` before using them as JavaScript numbers.
- Range also clamps the current inputs to the on-chain zone-size bounds for the active scale and surfaces the current RTP bounds in the field description.
- Plinko and Wheel switch to live config options when those on-chain parameters are available. The form only offers playable configs in the selector and automatically moves away from missing or disabled selections.
- The settings dialog is available from the top-right of the standard game controls card and is useful for inspecting the live parsed parameter object without leaving the playground.
- Limbo uses the exported SDK default multiplier scale, so the form shows how `targetMultiplier` is converted with `Math.round(targetMultiplier * scale)`.
- Range point inputs are human values, not pre-scaled integers. The form derives the allowed max from the exported SDK constants `RANGE_POINT_LIMIT / scale`, so the default SDK scale allows `0` to `100`.
- Full decoded event payloads are also logged to the browser console.
