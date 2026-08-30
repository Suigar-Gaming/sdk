---
'@suigar/sdk': major
'@suigar/mcp': major
---

Rename normalized event fields from `gameId` and `eventName` to `game` and `event`, add `parseSuigarEvent` for decoded event payloads and game details, expose `toU32` from SDK numeric utilities, and update MCP dry-run event summaries to expose `event`.
