---
'@suigar/mcp': minor
---

Add a persistent local session wallet shared by mainnet and testnet, with setup, recovery, direct import of standard `suiprivkey...` exports, and direct game-transaction execution backed by the operating system keychain. Private-key imports remain on the localhost-only setup page and are never included in MCP output or the session-wallet JSON file. Setup guidance and local pages identify it as a cross-network wallet rather than a network-specific wallet. `get_session_wallet` now includes complete formatted balances for the selected network and a prefilled paired-wallet funding URL when available, rendered in its dedicated Session Wallet view. When no wallet exists, that view provides the local setup link. Add `fund_session_wallet` to return a paired-wallet funding URL prefilled with the local session wallet address.
