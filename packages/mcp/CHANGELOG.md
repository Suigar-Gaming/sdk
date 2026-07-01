# @suigar/mcp

## 0.1.1

### Patch Changes

- f9d219c: Bump `@suigar/mcp` to `0.1.1` and refresh package metadata for the current SDK dependency set.
- 4d21957: Replace pack-time dependency staging scripts with `tsdown` dependency bundling, so private Suigar workspace packages are compiled into the MCP output instead of being copied into the published tarball.
- 135e404: Broaden the MCP bundle rule to include future `@suigar/*` workspace packages while keeping `@suigar/sdk` external as the published runtime SDK dependency.

## 0.1.0

### Minor Changes

- dca5598: Initial release of `@suigar/mcp`, a lightweight MCP server and library for Suigar game tooling.
  - Add config and metadata read helpers backed by released `@suigar/sdk` defaults.
  - Add MCP tools for building and dry-running on-chain transactions for coinflip, limbo, plinko, range, wheel, and PvP coinflip.
  - Add shared MCP support metadata so clients can distinguish on-chain games from unsupported backend-driven games such as slots.
  - Add transaction serialization helpers, read-only Sui client setup, stdio server entrypoint, tests, and README usage guidance.
