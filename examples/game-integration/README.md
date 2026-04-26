# `game-integration`

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
- PvP game selection scaffolded through a dedicated selector, with `pvp-coinflip` as the first option
- Join and cancel lobby cards backed by `client.suigar.getPvPCoinflipGames()`, with public join lobbies visible while disconnected, an optional private-lobby join toggle, connected-wallet filtering for cancel, compact multi-column cards, creator-side labels, privacy badges, and copyable game ids
- Live transaction-builder code preview
- A dedicated execute-transaction card that reads the connected wallet state directly from the new Mysten dApp Kit
- Decoding of `BetResultEvent`, `PvPCoinflipGameCreated`, `PvPCoinflipGameResolved`, and `PvPCoinflipGameCancelled`
- Oracle price formatting with `parseFloat` and game detail decoding with `parseGameDetails` from `@suigar/sdk/utils`
- Shared persistent event table across route and game changes

## Run it

From the repository root:

```bash
npm install
npm --prefix examples/game-integration install
npm --prefix examples/game-integration run dev
```

Then open [http://localhost:3000](http://localhost:3000).

The example app automatically runs `npm --prefix ../.. run build:ci` before `dev`, `build`, and `start` so the local `@suigar/sdk` package stays in sync.

## GitHub Pages

The repository includes `.github/workflows/deploy-game-integration-pages.yml` to build this app when files under `examples/game-integration/` change.

- Pull requests run the Pages build as a validation step.
- Pushes to `main` build and deploy the static export to GitHub Pages.
- The workflow can override the Next.js `basePath` through `PAGES_BASE_PATH`. Leave it empty for a custom domain served from the root, or set it to `/sdk` when publishing under the repository path.
- Public asset URLs used in `next/image` and metadata should go through `withBasePath()` from [`lib/paths.ts`](/Users/lucas/Documents/Github/suigar-sdk/examples/game-integration/lib/paths.ts) so they resolve correctly both locally and on GitHub Pages.

## Notes

- The app is fixed to `testnet`.
- Connected balances are fetched from the active wallet for each SDK-supported coin type and refresh after transaction execution.
- Stake inputs use human values such as `1` or `2.5` and are converted to atomic on-chain units before transaction creation where the selected action requires a stake.
- Limbo uses the exported SDK default multiplier scale, so the form shows how `targetMultiplier` is converted with `Math.round(targetMultiplier * scale)`.
- Range point inputs are human values, not pre-scaled integers. The form derives the allowed max from the exported SDK constants `RANGE_POINT_LIMIT / scale`, so the default SDK scale allows `0` to `100`.
- Full decoded event payloads are also logged to the browser console.
