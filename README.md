# Suigar TypeScript SDKs

A collection of TypeScript SDKs and MCP tooling for interacting with the Suigar contracts.

## Documentation

For SDK documentation, visit [suigar.com/docs/sdk](https://suigar.com/docs/sdk).

For MCP documentation, visit [suigar.com/docs/mcp](https://suigar.com/docs/mcp).

For Sui TypeScript SDK documentation, visit [sdk.mystenlabs.com](https://sdk.mystenlabs.com/).

## Install the MCP server

Install Suigar MCP for all detected coding agents with [add-mcp](https://www.npmjs.com/package/add-mcp):

```bash
npx add-mcp @suigar/mcp@latest --name suigar
```

Add `-y` to skip the installer prompts. Restart or reload your MCP client after installation.

To configure an MCP client manually, use:

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

## Agent Skills

Suigar agent skills live in the separate `Suigar-Gaming/agent-skills` repository. The MCP-focused skill teaches agents how to install, configure, and operate `@suigar/mcp` for Suigar config reads, game metadata, NFT lookups, referral claim reads, unsigned transaction builders, and dry-runs.

Install all Suigar skills with:

```bash
npx skills add Suigar-Gaming/agent-skills --global --yes
```

Install only the MCP skill with:

```bash
npx skills add Suigar-Gaming/agent-skills --skill suigar-mcp --global --yes
```

## Packages

- `@suigar/sdk` in `packages/sdk`: ESM-only TypeScript SDK for Suigar v2 Move contracts.
- `@suigar/mcp` in `packages/mcp`: MCP stdio server and MCP App for reading Suigar config, game metadata, NFTs, and referral claim amounts, plus building unsigned Suigar transactions through the SDK.

The SDK's public `@suigar/sdk/utils` entrypoint includes `DEFAULT_QUERY_LIMIT` (`50`), the reusable default page size for SDK queries. Import it instead of duplicating that value whenever an application or a new paginated SDK call needs the standard limit.

## Development

Any of the following commands can be run at the root of the project.

When running a task that depends on generated or built artifacts, use `turbo` to ensure task dependencies are run first.

### Setup

```bash
pnpm install
pnpm run build
```

Dependency install scripts are disabled by default in `pnpm-workspace.yaml`. If a new dependency needs an install or build script, explicitly review it before approving it with `pnpm approve-builds`. Transitive dependencies are also blocked from resolving untrusted git or tarball URLs.

### Building

```bash
pnpm run build
# or
pnpm turbo run build
```

### Unit Tests

For unit tests:

```bash
pnpm run test
# or
pnpm turbo run test
```

### Type Checking

```bash
pnpm run typecheck
# or
pnpm turbo run typecheck
```

### Linting

This repo uses Oxlint and Prettier for linting.

```bash
pnpm run lint
```

You can automatically fix many lint issues by running:

```bash
pnpm run lint:fix
```

To run Oxlint and Prettier individually, use:

```bash
pnpm run oxlint
pnpm run prettier
pnpm run oxlint:fix
pnpm run prettier:fix
```
