# `@suigar/mcp`

MCP server and MCP App for Suigar transaction workflows on Sui.

The server targets the MCP [`2025-11-25`](https://modelcontextprotocol.io/specification/2025-11-25) specification and registers tools/resources through the modern MCP server and MCP Apps APIs. Tool calls return tool execution errors (`isError: true`) for retryable validation or config failures rather than signing or executing transactions.

It provides:

- SDK-backed tools for reading Suigar config and live game metadata
- referral claimable-amount reads and unsigned claim builders
- unsigned transaction builders for standard Suigar games and PvP coinflip
- `build`, `dry-run`, and `read-only` modes
- a compact MCP App UI resource for compatible hosts
- text and structured-content fallbacks for normal MCP clients

Transactions remain unsigned by default. `mode: "execute"` uses the paired Suigar browser wallet and opens an explicit approval request unless `executionWallet: "session"` is selected. Session execution signs and submits directly from the local session-wallet key held in the operating-system keychain; it returns the final transaction digest without an approval URL. Wallet balance reads aggregate all result pages and display human-readable amounts using configured or on-chain coin metadata.

## Install

Install for all detected coding agents with [add-mcp](https://www.npmjs.com/package/add-mcp):

```bash
npx add-mcp @suigar/mcp@latest --name suigar
```

Add `-y` to skip the installer prompts. Restart or reload your MCP client after installation.

### Manual configuration

To add the stdio server to an MCP client yourself, use:

```json
{
	"mcpServers": {
		"suigar": {
			"command": "npx",
			"args": ["-y", "@suigar/mcp@latest"]
		}
	}
}
```

### Package installation

Install the package directly when you need to import its programmatic API or run a local copy:

```bash
npm install @suigar/mcp
```

The package also ships `plugin/` manifests for plugin-capable hosts:

- `plugin/.codex-plugin/plugin.json` for Codex
- `plugin/.claude-plugin/plugin.json` for Claude Code
- `plugin/.cursor-plugin/plugin.json` for Cursor
- `plugin/plugin.json` for Antigravity-style plugin discovery

The Codex, Claude, and Cursor manifests use the bundled `.mcp.json` MCP config, which registers the `npx -y @suigar/mcp@<package-version>` stdio server. Plugin manifest versions and the MCP config package specifier are kept in sync with `packages/mcp/package.json` by `pnpm run changeset:version`.

Repository marketplace catalogs support GitHub installation and local plugin testing:

- `.agents/plugins/marketplace.json` for ChatGPT desktop and Codex
- `.claude-plugin/marketplace.json` for Claude Code
- `.cursor-plugin/marketplace.json` for Cursor multi-plugin repository discovery

For Codex, install the marketplace from GitHub, then install the `suigar-mcp` plugin:

```bash
codex plugin marketplace add Suigar-Gaming/ts-sdks
codex plugin add suigar-mcp@suigar
```

For Claude Code, use the equivalent GitHub marketplace flow:

```bash
claude plugin marketplace add Suigar-Gaming/ts-sdks
claude plugin install suigar-mcp@suigar
```

Inside an interactive Claude Code session, use `/plugin marketplace add Suigar-Gaming/ts-sdks` and `/plugin install suigar-mcp@suigar` instead. For local development, replace `Suigar-Gaming/ts-sdks` with `.` in either marketplace-add command. ChatGPT desktop local testing works by opening the repository, restarting the app, opening the Plugins directory in Work mode or Codex, then installing `suigar-mcp` from the `Suigar` source.

For Cursor, the repository includes both the plugin manifest and a root `.cursor-plugin/marketplace.json` for multi-plugin repository flows. During local development, you can also copy or symlink `packages/mcp/plugin` into Cursor's local plugin directory and reload Cursor. If you only need MCP tools, direct MCP configuration with `npx -y @suigar/mcp` is simpler and does not require the plugin wrapper.

For local workspace development:

```bash
pnpm turbo run build --filter=@suigar/mcp
node packages/mcp/dist/bin.mjs
```

This builds the local workspace dependencies, MCP server, and bundled MCP App. Run the generated stdio entrypoint from the repository root for manual client testing.

## Tools

- `setup_session_wallet`
- `get_session_wallet`
- `fund_session_wallet`
- `suigar_login`
- `suigar_logout`
- `get_connection_status`
- `read_config`
- `read_game_metadata`
- `list_nfts`
- `get_wallet_balances`
- `list_wallet_coins`
- `get_execution_status`
- `get_referral_commission`
- `get_referral_level_up_usd_rewards`
- `build_referral_commission_claim_transaction`
- `build_referral_level_up_usd_rewards_claim_transaction`
- `build_nft_v1_mint_transaction`
- `build_coinflip_transaction`
- `build_limbo_transaction`
- `build_plinko_transaction`
- `build_soccer_transaction`
- `build_wheel_transaction`
- `build_range_transaction`
- `build_pvp_coinflip_create_transaction`
- `build_pvp_coinflip_join_transaction`
- `build_pvp_coinflip_cancel_transaction`

All tools return `content` text plus `structuredContent`. App-capable hosts render purpose-built views from one bundled MCP App: config discovery, live game parameters, NFT catalog/ownership, referral rewards, or transaction inspection.

### Wallet tools

- **Paired browser wallet**
  - `suigar_login`, `suigar_logout`, and `get_connection_status` manage the paired browser wallet.
  - `get_wallet_balances` and `list_wallet_coins` read aggregate balances or paginated coin objects. Both also accept an explicit address.
  - `get_execution_status` checks an `execute`-mode transaction's browser approval result.
- **Local session wallet**
  - `setup_session_wallet` opens a local, one-time setup page to create or recover one persistent session wallet shared by mainnet and testnet.
  - It does not require a paired browser wallet, and its recovery phrase never passes through MCP.
  - The derived signing key is persisted in the operating-system keychain.
  - `get_session_wallet` returns the public address, formatted balances, a funding QR code, and—when a wallet is paired on the selected network—a prefilled funding URL.
  - `fund_session_wallet` requires a paired wallet and opens a prefilled mcp-website transfer form. The user chooses an owned coin and amount, then reviews and signs the transfer in their browser.
  - In an App-capable host, it displays a dedicated Session Wallet view with balances, a funding QR code, and a paired-wallet funding link when available. Missing-wallet failures render as a tool error rather than a transaction inspector.
  - Fund only the amount the user is willing to delegate to the local MCP process.
  - For game tools, use `mode: "execute", executionWallet: "session"` to make the session wallet the sender and submit immediately. `owner` is optional in this mode; if supplied, it must match the session-wallet address. Ensure it is funded for both the wager and gas.
- **Command-line wallet management**
  - Run `npx -y @suigar/mcp login --network testnet` (or `mainnet`), `status`, `logout`, or `clean`.
  - Login uses a short-lived, localhost-only browser pairing flow and stores non-secret network-specific metadata in `~/.suigar-mcp/credentials.json` with owner-only permissions.
  - `status` inspects the current connection; `logout --all` disconnects every stored network; and `clean` removes the local credential file without opening a browser.
  - Set `SUIGAR_MCP_WEB_URL` to use a local or custom connection-page origin.
  - Run `npx -y @suigar/mcp tools` to print the network-independent tool catalog.

### Read tools

- `read_config`, `read_game_metadata`, `list_nfts`, wallet balance/coin reads, execution status, and the referral amount reads are read-only.
- SDK-backed reads accept shared network, provider, SDK config, and partner inputs.
- `read_game_metadata` additionally requires `game`; the NFT and referral reads additionally require an `owner` address or SuiNS name.
- Referral reads simulate the SDK's real claim transaction and return `0` when it cannot be claimed or simulated.
- `get_referral_commission` accepts an optional `coinType` (defaulting to configured SUI); level-up USD rewards use configured USDC.

In an App-capable host, the NFT view presents catalog and owned-NFT tables separately. HTTPS NFT image URLs are displayed as thumbnails, while unavailable or unsupported image URLs remain visible as text. Referral reads render a dedicated Referral Rewards view with the referrer, reward type, coin type, and simulated claimable amount.

### Transaction tools

All transaction tools accept the shared config inputs and support these `mode` values:

- `read-only`: resolves SDK config and returns the intended Move target, type arguments, required inputs, and notes.
- `build`: returns unsigned transaction bytes as base64 plus a transaction summary with resolved shared inputs and game-specific `gameInputs` such as coinflip `side`, limbo `targetMultiplier`, plinko/wheel `configId`, and range points.
- `dry-run`: simulates the unsigned transaction through Mysten client APIs and returns a JSON-safe raw `dryRun` result plus a stable `dryRunSummary`. Failed dry-runs include an `errors` array extracted from the failed transaction status.
- `execute`: by default opens a paired-wallet approval request. Set `executionWallet: "session"` for game tools to have MCP sign and execute immediately with the local session wallet instead.

Dry-run summaries include:

- `success` and `error`
- gas computation, storage, rebate, non-refundable storage fee, and net gas delta as raw base units plus decimal-formatted display values
- balance changes as raw base units plus decimal-formatted display values
- decoded event fields when available, including standard `BetResultEvent` game details such as `player_bet`, `coin_outcome`, `stake_amount`, and `outcome_amount`; the MCP App renders all parsed result fields it receives, so non-coinflip games expose their own parsed result keys as well

### Shared transaction inputs

For `build`, `dry-run`, and paired-wallet `execute`, provide `owner`, a raw Sui address, SuiNS name such as `name.sui`, or SuiNS subname such as `sub.name.sui`. SuiNS owners are resolved through the configured network before the unsigned transaction is built or dry-run. In session execution (`mode: "execute", executionWallet: "session"`), MCP uses the local session-wallet address and no owner is required. `read-only` can be used to inspect a tool's requirements before providing an owner.

`coinType` defaults to configured SUI. Transaction `stake` and `cashStake` inputs are currency amounts in the chosen coin, not base-unit integers. For example, `stake: 1` means `1` SUI or `1` USDC depending on the resolved coin type. The MCP server uses the configured coin `decimals` value to convert those amounts into base units before calling the SDK transaction builders.

Optional shared transaction inputs are `metadata`, `gasBudget` (in MIST), and `useGasCoin` for native SUI bets. Metadata values must be JSON-compatible strings, numbers, or booleans; send large integers as strings.

When `betCount` is provided for Limbo, Plinko, Range, Soccer, or Wheel, the MCP server reads the active on-chain parameters and rejects a value above that game's declared maximum. Coinflip does not declare a maximum bet count.

### Workflow-specific inputs

| Workflow | Required inputs | Optional inputs | Notes |
| --- | --- | --- | --- |
| Coinflip | `side` | — | — |
| Limbo | `targetMultiplier` | — | — |
| Plinko, Wheel | `configId` | — | — |
| Soccer | `configId`, `countryId`, `shotZoneId` | — | — |
| Range | `leftPoint`, `rightPoint` | `outOfRange` | — |
| PvP Coinflip Create | `creatorSide` | `isPrivate` | — |
| PvP Coinflip Join, Cancel | `gameId` | — | — |
| Referral Commission Claim | `owner` | `coinType` | `coinType` defaults to configured SUI. |
| Referral Level-up USD Rewards Claim | `owner` | — | Uses configured USDC. |
| NFT V1 Mint | `owner`, `specId` | — | Resolves the specification's SUI price from the configured NFT factory when built. |

## Config

`network` defaults to `testnet`. Only `mainnet` and `testnet` are supported.

Optional `config` input follows the public SDK extension override shape:

```ts
{
	packageIds?: {
		nftV1?: string;
		referral?: string;
		core?: string;
		coinflip?: string;
		limbo?: string;
		plinko?: string;
		pvpCoinflip?: string;
		range?: string;
		soccer?: string;
		wheel?: string;
	};
	objectIds?: {
		sweetHouse?: string;
		nftV1Factory?: string;
	};
	registryIds?: { pvpCoinflip?: string };
	coins?: {
		sui?: { coinType?: string; decimals?: number; priceInfoObjectId?: string };
		usdc?: { coinType?: string; decimals?: number; priceInfoObjectId?: string };
	};
}
```

Partner attribution should be passed as top-level `partner`; the MCP server forwards it through `suigar({ partner })`.

Transaction `metadata` values must be JSON-compatible strings, numbers, or booleans. Send large integer metadata values as strings.

## Notes

- Coin object ids and explicit coin sourcing are intentionally not exposed.
- The MCP package uses `@suigar/sdk` public builders instead of copied internal transaction builders.
- PvP coinflip join may need live object reads when serialized or dry-run, because the SDK resolves the current game stake from the game object.
