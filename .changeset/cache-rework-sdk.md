---
'@suigar/sdk': minor
---

Treat non-positive `cacheTtl` values as disabling SDK-managed game parameter caching and route TTL cache reads through a shared internal cache helper.

Add `SuigarClient.reset()` to clear cached SDK reads for the extension instance.
