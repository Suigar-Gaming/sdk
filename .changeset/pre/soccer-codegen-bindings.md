---
'@suigar/sdk': major
---

Split singleton object ids into `config.objectIds`, leaving only Move package addresses in `config.packageIds`; `sweetHouse` and `legacyNftFactory` move to `config.objectIds`. Network configuration files now use consistent package, object, registry, and coin modules.
