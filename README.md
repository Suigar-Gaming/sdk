# Suigar TypeScript SDKs

A collection of TypeScript SDKs and MCP tooling for interacting with the Suigar contracts.

## Documentation

For SDK documentation, visit [suigar.com/docs/sdk](https://suigar.com/docs/sdk).

For MCP documentation, visit [suigar.com/docs/mcp](https://suigar.com/docs/mcp).

For Sui TypeScript SDK documentation, visit [sdk.mystenlabs.com](https://sdk.mystenlabs.com/).

## Agent Skills

Suigar agent skills live in the separate `Suigar-Gaming/agent-skills` repository. The MCP-focused skill teaches agents how to install, configure, and operate `@suigar/mcp` for Suigar config reads, game metadata, unsigned transaction builders, and dry-runs.

Install all Suigar skills with:

```bash
npx skills add Suigar-Gaming/agent-skills --global --yes
```

Install only the MCP skill with:

```bash
npx skills add Suigar-Gaming/agent-skills --skill suigar-mcp --global --yes
```

Then configure your MCP client to run the published server:

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

Restart or reload the MCP client after changing its config.

## Packages

- `@suigar/sdk` in `packages/sdk`: ESM-only TypeScript SDK for Suigar v2 Move contracts.
- `@suigar/mcp` in `packages/mcp`: MCP stdio server and MCP App for reading Suigar config and building unsigned Suigar transactions through the SDK.

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
