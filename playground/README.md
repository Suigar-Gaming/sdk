# Suigar Playground

Next.js example app for the Suigar SDK. It runs on Sui testnet and uses:

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
- NFT route: `/nft`, which reads the configured NFT factory and marks each NFT spec as directly possessed or not possessed by the connected wallet
- Query-param game selection
- Shared supported-coin selector using `client.suigar.getConfig().coins`
- Connected-wallet balance cards for every supported coin type
- Per-game form components for standard and PvP Coinflip flows
- Standard game forms backed by `client.suigar.getGameParameters()` for live on-chain stake ranges, per-game parameter bounds, and Plinko/Soccer/Wheel config selection
- A game-settings dialog in the controls card that shows the current typed `getGameParameters()` result, available configs when present, lookup request, raw payload, and expandable detail views for both standard games and PvP coinflip
- PvP game selection scaffolded through a dedicated selector, with `pvp-coinflip` as the first option
- Join and cancel lobby cards backed by `client.suigar.getPvPCoinflipGames()`, using each returned lobby's `coin_type` field for coin selection and display, with public join lobbies visible while disconnected, an optional private-lobby join toggle, connected-wallet filtering for cancel, compact multi-column cards, creator-side labels, privacy badges, and copyable game ids
- Live transaction-builder code preview
- A dedicated execute-transaction card that reads the connected wallet state directly from the new Mysten dApp Kit
- Decoding of `BetResultEvent`, `PvPCoinflipGameCreatedEvent`, `PvPCoinflipGameResolvedEvent`, and `PvPCoinflipGameCancelledEvent`
- Oracle price formatting with `fromMoveFloat` and game detail decoding with `parseGameDetails` from `@suigar/sdk/utils`
- Shared persistent event table across route and game changes

## Development

From the repository root:

```bash
pnpm install
pnpm turbo run dev --filter='./playground'
```

Then open [http://localhost:3000](http://localhost:3000).

The app resolves the workspace-local `@suigar/sdk` package through `workspace:^`. Use the root Turbo command when you want the SDK dependency graph built first with `build:ci` before the app command starts.

Build the app:

```bash
pnpm turbo run build --filter='./playground'
```

Useful local checks:

```bash
pnpm --dir playground run lint
pnpm --dir playground run lint:fix
pnpm --dir playground run typecheck
```

## Notes

- The app is fixed to `testnet`.
- Connected balances are fetched from the active wallet for each SDK-supported coin type and refresh after transaction execution.
- The NFT page uses `client.core.listOwnedObjects()` with the SDK-configured NFT type, decodes objects with the SDK's NFT BCS helpers, and does not include NFTs held in a Kiosk.
- Stake inputs use human values such as `1` or `2.5` and are converted to atomic on-chain units before transaction creation where the selected action requires a stake.
- Standard game stake fields show the current on-chain min and max range for the selected coin, and the form clamps stake back into the allowed range when live parameters load or change.
- Standard games expose optional bet count; leave it empty to use the SDK default of `1`.
- Limbo clamps `targetMultiplier` to the on-chain `min_target_multiplier` and `max_target_multiplier` bounds. `getGameParameters()` returns those fields as JavaScript numbers.
- Range also clamps the current inputs to the on-chain zone-size bounds for the active scale and surfaces the current RTP bounds in the field description.
- Plinko, Soccer, and Wheel switch to live config options when those on-chain parameters are available. The form only offers playable configs in the selector and automatically moves away from missing or disabled selections.
- The settings dialog is available from the top-right of both the standard and PvP controls cards and is useful for inspecting the live parsed parameter object without leaving the playground.
- Limbo uses the exported SDK default multiplier scale, so the form shows how `targetMultiplier` is converted with `Math.round(targetMultiplier * scale)`.
- Range point inputs are human values, not pre-scaled integers. The form derives the allowed max from the exported SDK constants `RANGE_POINT_LIMIT / scale`, so the default SDK scale allows `0` to `100`.
- Full decoded event payloads are also logged to the browser console.
