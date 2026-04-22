---
'@suigar/sdk': patch
---

Improve public transaction builder typings and refresh Sui 2.0+ integration guidance around the gRPC client.

- Fix exported transaction option types so `BuildGameOptions` and `BuildPvPGameOptions` no longer require the internal `config` field
- Update installation and integration documentation for Sui 2.0+ by switching examples to `SuiGrpcClient`, clarifying required peer dependencies, and aligning transaction-result examples with the current client API.
