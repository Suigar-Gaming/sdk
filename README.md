# `@suigar/ts-sdks`

pnpm workspace repository for Suigar TypeScript SDK packages.

## Packages

- [`@suigar/sdk`](packages/sdk) - TypeScript SDK for building Suigar v2 game transactions on Sui.

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

The package implementation lives in `packages/sdk`. Root scripts forward SDK build, codegen, test, and typecheck commands to the `@suigar/sdk` workspace through pnpm filters.
