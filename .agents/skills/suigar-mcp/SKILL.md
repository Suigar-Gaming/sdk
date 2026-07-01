---
name: suigar-mcp
description: Use when installing, configuring, operating, or troubleshooting the @suigar/mcp server or MCP App for Suigar game metadata, unsigned transaction builders, read-only plans, build mode, and dry-run flows.
---

# Suigar MCP

Use this skill when a user wants an MCP client or coding agent to work with
Suigar through `@suigar/mcp`.

The MCP server is a thin layer over `@suigar/sdk`. It reads Suigar config and
game metadata, builds unsigned transactions, and can dry-run those unsigned
transactions. It never signs, submits, executes, or custodies private keys.

## Install and configure

Configure MCP clients with the published package:

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

After changing MCP client config, tell the user to restart or reload the client
so it starts the server.

For local workspace development, use:

```bash
pnpm --dir packages/mcp start:local
```

This builds the local SDK dependency, builds the MCP package, and starts the
stdio server from the workspace output.

## Tool routing

Start with read tools when the user is exploring:

- `read_config`: inspect network, provider URL, package ids, configured coins,
  and supported games with their MCP tools.
- `read_game_metadata`: inspect one game's package id, default or requested
  coin type, transaction surface, and support notes.

Use transaction tools only for supported on-chain games:

- `build_coinflip_transaction`
- `build_limbo_transaction`
- `build_plinko_transaction`
- `build_range_transaction`
- `build_wheel_transaction`
- `build_pvp_coinflip_create_transaction`
- `build_pvp_coinflip_join_transaction`
- `build_pvp_coinflip_cancel_transaction`

Do not invent MCP tools for unsupported games. Slots are backend-driven and are
not exposed as an MCP transaction builder.

## Modes

Use the lightest mode that answers the request:

- `read-only`: return a resolved transaction plan without building bytes.
- `build`: build unsigned transaction bytes as base64 for a wallet or app to
  sign.
- `dry-run`: simulate the unsigned transaction through Sui client APIs and
  return raw and summarized dry-run data.

All tool responses should include text `content` and `structuredContent`.
App-capable clients may render the bundled Suigar Transaction Inspector UI.

## Common inputs

- `network` defaults to `testnet`; only `testnet` and `mainnet` are supported.
- `providerUrl` can override the Sui gRPC endpoint.
- `config` accepts SDK-style package, registry, coin, and price-info overrides.
- `partner` is a top-level partner wallet address forwarded through
  `suigar({ partner })`.
- `owner` accepts a Sui address, SuiNS name, or SuiNS subname in build and
  dry-run modes.
- `coinType` defaults to the SDK-configured SUI coin type.
- `stake` and `cashStake` are currency amounts, such as `1` or `1.5`, not base
  units. The MCP server converts them using the configured coin decimals before
  calling the SDK.
- `metadata` values must be JSON-compatible strings, numbers, or booleans. Send
  large integer metadata values as strings.
- `gasBudget` is in MIST.
- `useGasCoin` is only for native SUI bet coin handling when overriding
  Mysten's default coin intent behavior.

Do not pass explicit coin object ids. The MCP package intentionally does not
expose coin-object sourcing and uses SDK public transaction builders.

## Game inputs

Standard game tools share `owner`, `stake`, optional `cashStake`, optional
`betCount`, `coinType`, metadata, and config inputs.

Game-specific fields:

- Coinflip: `side: "heads" | "tails"`
- Limbo: `targetMultiplier: number`
- Plinko: `configId: number`
- Range: `leftPoint: number`, `rightPoint: number`, optional `outOfRange`
- Wheel: `configId: number`

PvP coinflip fields:

- Create: `owner`, `stake`, `creatorSide`, optional `isPrivate`
- Join: `owner`, `gameId`, optional `coinType`
- Cancel: `owner`, `gameId`, optional `coinType`

PvP coinflip create uses the MCP field name `creatorSide`; the SDK builder
receives that value as its `side` option.

## Guardrails

- Keep MCP usage read-only with respect to user assets: build, dry-run, or
  inspect only.
- Use `read_config` before building when network, coin, or package ids are
  uncertain.
- Pass partner attribution as top-level `partner`; do not set
  `metadata.partner` or `metadata.referrer`.
- Use PvP tools for PvP coinflip. Do not route PvP coinflip through standard
  game builders.
- For PvP join, expect live object reads while building or dry-running because
  the SDK resolves the current game stake from the game object.
- Surface tool errors with the missing field, unsupported config, network, or
  coin detail the user or agent needs to retry.
