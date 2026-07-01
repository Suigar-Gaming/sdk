---
"@suigar/mcp": minor
---

Add MCP App support and refreshed transaction tooling.

Add the bundled Suigar Transaction Inspector MCP App, concise `suigar` server-scoped tool names, read-only/build/dry-run transaction modes, currency-denominated stake handling, SuiNS owner resolution, game-specific transaction summaries, dry-run gas and balance summaries, extracted dry-run errors, decoded event fields, and coverage for the updated tool behavior.

The package metadata is refreshed for the current SDK dependency set, and the package build uses `tsdown` dependency bundling for private Suigar workspace packages while keeping `@suigar/sdk` external as the published runtime SDK dependency.
