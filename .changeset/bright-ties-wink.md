---
'@suigar/sdk': patch
---

Refine public validation failures to use `RangeError` and `TypeError` instead
of generic `Error` for unsupported networks, unsupported game or PvP action
inputs, unsupported configured coin types, bounded integer helpers, and
`parseCoinType()` parsing failures.
