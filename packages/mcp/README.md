# `@suigar/mcp`

MCP server and MCP App for Suigar transaction workflows on Sui.

It provides:

- SDK-backed tools for reading Suigar config and live game metadata
- unsigned transaction builders for standard Suigar games and PvP coinflip
- `build`, `dry-run`, and `read-only` modes
- a compact MCP App UI resource for compatible hosts
- text and structured-content fallbacks for normal MCP clients

The package never signs or executes transactions.

The server targets the MCP [`2025-11-25`](https://modelcontextprotocol.io/specification/2025-11-25) specification and registers tools/resources through the modern MCP server and MCP Apps APIs. Tool calls return tool execution errors (`isError: true`) for retryable validation or config failures rather than signing or executing transactions.

## Install

```bash
npm install @suigar/mcp
```

Use the stdio server from an MCP client:

```json
{
	"mcpServers": {
		"suigar": {
			"command": "npx",
			"args": ["-y", "@suigar/mcp"]
		}
	}
}
```

The package also ships `plugin/` manifests for plugin-capable hosts:

- `plugin/.codex-plugin/plugin.json` for Codex
- `plugin/.claude-plugin/plugin.json` for Claude Code
- `plugin/.cursor-plugin/plugin.json` for Cursor
- `plugin/plugin.json` for Antigravity-style plugin discovery

The Codex, Claude, and Cursor manifests use the bundled `.mcp.json` MCP config, which registers the `npx -y @suigar/mcp@<package-version>` stdio server. Plugin manifest versions and the MCP config package specifier are kept in sync with `packages/mcp/package.json` by `pnpm run changeset:version`.

Repo-level marketplace catalogs are included for local plugin testing:

- `.agents/plugins/marketplace.json` for ChatGPT desktop and Codex
- `.claude-plugin/marketplace.json` for Claude Code
- `.cursor-plugin/marketplace.json` for Cursor multi-plugin repository discovery

For ChatGPT desktop or Codex local testing, open the repository in ChatGPT desktop, restart the app, open the Plugins directory in Work mode or Codex, then install `suigar` from the `Suigar` source. The same marketplace can be registered from the Codex CLI with:

```bash
codex plugin marketplace add .
```

For Claude Code local testing, add this repository as a marketplace from the repository root and install the plugin:

```text
/plugin marketplace add .
/plugin install suigar@suigar
```

For Cursor, the repository includes both the plugin manifest and a root `.cursor-plugin/marketplace.json` for multi-plugin repository flows. During local development, you can also copy or symlink `packages/mcp/plugin` into Cursor's local plugin directory and reload Cursor. If you only need MCP tools, direct MCP configuration with `npx -y @suigar/mcp` is simpler and does not require the plugin wrapper.

For local workspace development:

```bash
pnpm turbo run build --filter=@suigar/mcp
node packages/mcp/dist/bin.mjs
```

This builds the local workspace dependencies, MCP server, and bundled MCP App. Run the generated stdio entrypoint from the repository root for manual client testing.

## Tools

- `read_config`
- `read_game_metadata`
- `build_coinflip_transaction`
- `build_limbo_transaction`
- `build_plinko_transaction`
- `build_wheel_transaction`
- `build_range_transaction`
- `build_pvp_coinflip_create_transaction`
- `build_pvp_coinflip_join_transaction`
- `build_pvp_coinflip_cancel_transaction`

All tools return `content` text plus `structuredContent`. App-capable hosts can render the shared Suigar Transaction Inspector UI for transaction tools. Use `read_game_metadata` for live on-chain parameters for one selected game, and `read_config` for broad network config and supported-game discovery.

## Modes

- `read-only`: resolves SDK config and returns the intended Move target, type arguments, required inputs, and notes.
- `build`: returns unsigned transaction bytes as base64 plus a transaction summary with resolved shared inputs and game-specific `gameInputs` such as coinflip `side`, limbo `targetMultiplier`, plinko/wheel `configId`, and range points.
- `dry-run`: simulates the unsigned transaction through Mysten client APIs and returns a JSON-safe raw `dryRun` result plus a stable `dryRunSummary`. Failed dry-runs include an `errors` array extracted from the failed transaction status.

Dry-run summaries include:

- `success` and `error`
- gas computation, storage, rebate, non-refundable storage fee, and net gas delta as raw base units plus decimal-formatted display values
- balance changes as raw base units plus decimal-formatted display values
- decoded event fields when available, including standard `BetResultEvent` game details such as `player_bet`, `coin_outcome`, `stake_amount`, and `outcome_amount`; the MCP App renders all parsed result fields it receives, so non-coinflip games expose their own parsed result keys as well

## Inputs

Transaction `owner` inputs accept raw Sui addresses, SuiNS names such as `name.sui`, and SuiNS subnames such as `sub.name.sui`. SuiNS owners are resolved through the configured network before the unsigned transaction is built or dry-run.

Transaction `stake` and `cashStake` inputs are currency amounts in the chosen or default configured coin, not base-unit integers. For example, `stake: 1` means `1` SUI or `1` USDC depending on the resolved coin type. The MCP server uses the configured coin `decimals` value to convert those amounts into base units before calling the SDK transaction builders.

## Config

`network` defaults to `testnet`. Only `mainnet` and `testnet` are supported.

Optional `config` input follows the public SDK extension override shape:

```ts
{
	packageIds?: {
		sweetHouse?: string;
		core?: string;
		coinflip?: string;
		limbo?: string;
		plinko?: string;
		pvpCoinflip?: string;
		range?: string;
		wheel?: string;
	};
	registryIds?: { pvpCoinflip?: string };
	coins?: { sui?: { coinType?: string; decimals?: number } };
	priceInfoObjectIds?: { sui?: string; usdc?: string };
}
```

Partner attribution should be passed as top-level `partner`; the MCP server forwards it through `suigar({ partner })`.

Transaction `metadata` values must be JSON-compatible strings, numbers, or booleans. Send large integer metadata values as strings.

## Notes

- Coin object ids and explicit coin sourcing are intentionally not exposed.
- The MCP package uses `@suigar/sdk` public builders instead of copied internal transaction builders.
- PvP coinflip join may need live object reads when serialized or dry-run, because the SDK resolves the current game stake from the game object.
