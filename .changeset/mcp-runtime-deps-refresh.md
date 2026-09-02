---
'@suigar/mcp': patch
---

Refresh MCP runtime dependencies for keychain storage, QR generation, and Zod schemas. Session wallet keyring access now loads lazily with an actionable unavailable-storage error, and funding QR codes use the QR encoder's native GIF data URL output.
