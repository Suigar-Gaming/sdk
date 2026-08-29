---
'@suigar/sdk': major
'@suigar/mcp': major
---

Narrow PvP Coinflip cancel transaction inputs so `cancelGame` no longer accepts `metadata` or `useGasCoin`, since cancellation does not create a bet coin or write metadata on-chain. The MCP cancel transaction tool schema now follows the same narrower shape.
