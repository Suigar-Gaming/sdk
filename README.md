# Suigar TypeScript SDKs

A collection of TypeScript SDKs and MCP tooling for interacting with the Suigar
contracts.

## Documentation

For SDK documentation, visit [docs.suigar.com/sdk](https://docs.suigar.com/sdk).

For MCP documentation, visit [docs.suigar.com/mcp](https://docs.suigar.com/mcp).

For Sui TypeScript SDK documentation, visit [sdk.mystenlabs.com](https://sdk.mystenlabs.com/).

## Agent Skills

Suigar agent skills live in the separate `Suigar-Gaming/agent-skills`
repository. The MCP-focused skill teaches agents how to install, configure, and
operate `@suigar/mcp` for Suigar config reads, game metadata, unsigned
transaction builders, and dry-runs.

Install all Suigar skills with:

```bash
npx skills add Suigar-Gaming/agent-skills --agent codex --global --yes
```

Install only the MCP skill with:

```bash
npx skills add Suigar-Gaming/agent-skills --skill suigar-mcp --agent codex --global --yes
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

- `@suigar/sdk` in `packages/sdk`: ESM-only TypeScript SDK for Suigar v2 Move
  contracts.
- `@suigar/mcp` in `packages/mcp`: MCP stdio server and MCP App for reading
  Suigar config and building unsigned Suigar transactions through the SDK.

## Development

Any of the following commands can be run at the root of the project.

When running a task that depends on generated or built artifacts, use `turbo` to
ensure task dependencies are run first.

### Setup

```bash
pnpm install
pnpm build
```

Dependency install scripts are disabled by default in `pnpm-workspace.yaml`. If
a new dependency needs an install or build script, explicitly review it before
approving it with `pnpm approve-builds`. Transitive dependencies are also
blocked from resolving untrusted git or tarball URLs.

### Building

```bash
pnpm build
# or
pnpm turbo build
```

### Unit Tests

For unit tests:

```bash
pnpm test
# or
pnpm turbo test
```

### Type Checking

```bash
pnpm typecheck
# or
pnpm turbo typecheck
```

### Linting

This repo uses ESLint and Prettier for linting.

```bash
pnpm lint
```

You can automatically fix many lint issues by running:

```bash
pnpm lint:fix
```

To run ESLint and Prettier individually, use:

```bash
pnpm eslint
pnpm prettier
pnpm eslint:fix
pnpm prettier:fix
```
