---
"@suigar/mcp": patch
---

Refactor the bundled MCP App inspector into a React component app and reorganize the MCP package internals.

The bundled MCP App now uses React, Tailwind theme tokens, and smaller inspector components for context, transaction, gas, dry-run, notes, errors, targets, and raw payload views. The app also uses package-version injection from `package.json`, renders status labels consistently, removes decorative shadows, and shows a compact connection state before host context is available.

The MCP server source is split into runtime, server, and tool modules while keeping the published entrypoints unchanged. Tool handlers, schemas, app resource registration, dry-run helpers, formatting helpers, and runtime client helpers now live in focused files with tests organized to match.
