---
'@suigar/mcp': patch
---

Use Noble Ciphers’ portable byte utilities for MCP wallet bridge state, request IDs, and session-wallet identifiers, with Node’s native timing-safe byte comparison used when available and Noble’s portable fallback elsewhere. Prefer Web Crypto UUIDs with a Noble-backed v4 fallback.
