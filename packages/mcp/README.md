# `@suigar/mcp`

MCP server and MCP App for Suigar transaction workflows on Sui.

It provides:

- SDK-backed tools for reading Suigar config and game metadata
- unsigned transaction builders for standard Suigar games and PvP coinflip
- `build`, `dry-run`, and `read-only` modes
- a compact MCP App UI resource for compatible hosts
- text and structured-content fallbacks for normal MCP clients

The package never signs or executes transactions.

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

For local workspace development:

```bash
pnpm --dir packages/mcp start:local
```

This builds the local `@suigar/sdk` workspace package first, then builds and
starts the MCP stdio server from `packages/mcp/dist/bin.mjs`.

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

All tools return `content` text plus `structuredContent`. App-capable hosts can
render the shared Suigar Transaction Inspector UI for game metadata and
transaction tools.

## Modes

- `read-only`: resolves SDK config and returns the intended Move target, type
  arguments, required inputs, and notes.
- `build`: returns unsigned transaction bytes as base64 plus a transaction
  summary.
- `dry-run`: simulates the unsigned transaction through Mysten client APIs and
  returns the dry-run result plus summary.

## Inputs

Transaction `owner` inputs accept raw Sui addresses, SuiNS names such as
`name.sui`, and SuiNS subnames such as `sub.name.sui`. SuiNS owners are resolved
through the configured network before the unsigned transaction is built or
dry-run.

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

Partner attribution should be passed as top-level `partner`; the MCP server
forwards it through `suigar({ partner })`.

Transaction `metadata` values must be JSON-compatible strings, numbers, or
booleans. Send large integer metadata values as strings.

## Notes

- Coin object ids and explicit coin sourcing are intentionally not exposed.
- The MCP package uses `@suigar/sdk` public builders instead of copied internal
  transaction builders.
- PvP coinflip join may need live object reads when serialized or dry-run,
  because the SDK resolves the current game stake from the game object.
