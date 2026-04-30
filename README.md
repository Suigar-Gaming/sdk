# `@suigar/ts-sdks`

pnpm workspace repository for Suigar TypeScript SDK packages.

## Packages

- [`@suigar/sdk`](packages/sdk) - TypeScript SDK for building Suigar v2 game transactions on Sui.

## Development

```bash
pnpm install
pnpm --dir packages/sdk build
pnpm --dir packages/sdk test
pnpm --dir packages/sdk typecheck
```

The package implementation lives in `packages/sdk`. Build, codegen, test, and typecheck commands are package-level commands and should be run with `pnpm --dir packages/sdk ...`.
