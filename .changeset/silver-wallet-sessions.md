---
'@suigar/mcp': minor
---

Add a persistent local session wallet shared by mainnet and testnet, with setup, recovery, and direct game-transaction execution backed by the operating system keychain. Setup guidance and local pages identify it as a cross-network wallet rather than a network-specific wallet. `get_session_wallet` now includes formatted balances and a prefilled paired-wallet funding URL when available, rendered in its dedicated Session Wallet view. Add `fund_session_wallet` to return a paired-wallet funding URL prefilled with the local session wallet address.
