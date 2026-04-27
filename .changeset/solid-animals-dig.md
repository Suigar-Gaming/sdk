---
'@suigar/sdk': patch
---

Refine Move parser helpers by simplifying BCS type usage, normalizing missing
`i64` and float mantissa values to `0`, and documenting the numeric conversion
behavior in `fromMoveI64` and `fromMoveFloat`.
