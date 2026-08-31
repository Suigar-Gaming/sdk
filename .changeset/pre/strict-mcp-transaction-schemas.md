---
'@suigar/mcp': patch
---

Tighten MCP transaction tool schemas so build, dry-run, and execute modes reject missing SDK-required transaction fields while still allowing read-only planning. Validate SweetHouse redeem request IDs, PvP Coinflip game IDs, and NFT specification IDs as Sui object IDs.
