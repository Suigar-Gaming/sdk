---
'@suigar/sdk': patch
---

Treat non-positive `cacheTtl` values as disabling SDK-managed game parameter caching and route TTL cache reads through a shared internal cache helper.
