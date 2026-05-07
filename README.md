# Suigar Typescript SDK

A collection of TypeScript SDKs for interacting with the Suigar contracts.

## Docs Site

For complete Suigar SDK docs, visit [docs.suigar.com/sdk](https://docs.suigar.com/sdk).

This SDK builds on the Sui TypeScript SDK. For Sui client, transaction, and network APIs, visit the [Sui TypeScript SDK docs](https://sdk.mystenlabs.com/).

## Suigar TypeScript SDK

The publishable package in this repository is [`@suigar/sdk`](packages/sdk). It provides utility classes, types, generated Move bindings, and transaction builders for applications that build Suigar v2 game transactions on Sui. The package is ESM-only and is built with `tsdown`.

The main integration path is the `suigar()` extension on top of a Sui client such as `SuiGrpcClient`. The SDK targets Sui TypeScript SDK 2.0+ and supports standard Suigar games plus PvP coinflip flows.

Public package entrypoints:

- `@suigar/sdk` for `suigar()` and `SuigarClient`
- `@suigar/sdk/games` for game option and action types
- `@suigar/sdk/utils` for parser helpers, numeric helpers, and reusable constants

Utility behavior from `@suigar/sdk/utils`:

- `toBigInt(value)` accepts `bigint`, finite `number`, non-negative integer
  `string`, and `boolean` inputs and returns a normalized non-negative `bigint`
  while throwing `TypeError` for invalid input shapes and `RangeError` for
  negative values
- `toU8(value)` accepts a finite integer `number` or plain integer `string`
  in the `0..255` range, throwing `TypeError` for non-numeric input and
  `RangeError` for booleans, fractional values, or out-of-range integers
- `toU16(value)` accepts a finite integer `number` or plain integer `string`
  in the `0..65535` range, throwing `TypeError` for non-numeric input and
  `RangeError` for booleans, fractional values, or out-of-range integers
- `fromMoveI64(value)` converts a generated Move `i64` wrapper into a
  JavaScript `number`
- `fromMoveFloat(value)` converts a generated Move float struct into a
  JavaScript `number`
- `parseCoinType(type)` extracts the normalized first generic coin type from a
  Move object type string and throws `TypeError` when no coin type can be parsed
- `parseGameDetails(gameId, gameDetails)` decodes standard `BetResultEvent.game_details`
  byte arrays into the expected string, number, and boolean values while
  preserving the original on-chain keys

## Building Locally

To get started, install [pnpm](https://pnpm.io/) and run commands from the repository root:

```bash
# Install all dependencies
pnpm install

# Generate bindings and build the SDK package
pnpm --dir packages/sdk build

# Build without regenerating contract bindings
pnpm --dir packages/sdk build:ci

# Regenerate Move contract bindings only
pnpm --dir packages/sdk codegen
```

The package implementation lives in `packages/sdk`. Build, codegen, test, and typecheck commands should be run with `pnpm --dir packages/sdk ...`.

## Testing

Run the SDK test suite:

```bash
pnpm --dir packages/sdk test
```

Run TypeScript checking:

```bash
pnpm --dir packages/sdk typecheck
```

Run a specific Vitest file:

```bash
pnpm --dir packages/sdk exec vitest run test/unit/transactions.test.ts
```

Run a specific test name:

```bash
pnpm --dir packages/sdk exec vitest run -t "builds a coinflip transaction with the configured package id"
```

## Playground

The repository includes a Next.js integration playground in [`apps/playground`](apps/playground). It demonstrates standard game transactions, PvP coinflip transactions, wallet integration, live transaction code previews, and event decoding.

Run it locally:

```bash
pnpm turbo run dev --filter='./apps/playground'
```

Then open [http://localhost:3000](http://localhost:3000).

## Connecting to Sui Network

`SuiGrpcClient` from `@mysten/sui/grpc` is the recommended client for Sui TypeScript SDK 2.0+ integrations.

Common gRPC fullnode URLs:

- Testnet: `https://fullnode.testnet.sui.io:443`
- Mainnet: `https://fullnode.mainnet.sui.io:443`

```ts
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { suigar } from '@suigar/sdk';

const client = new SuiGrpcClient({
	network: 'testnet',
	baseUrl: 'https://fullnode.testnet.sui.io:443',
}).$extend(suigar());

const coins = await client.core.getCoins({
	owner: '0xcc2bd176a478baea9a0de7a24cd927661cc6e860d5bacecb9a138ef20dbab231',
});
```

## Getting Coins From The Faucet

You can request SUI from the testnet faucet at [faucet.sui.io](https://faucet.sui.io/).

```ts
import { getFaucetHost, requestSuiFromFaucetV2 } from '@mysten/sui/faucet';

await requestSuiFromFaucetV2({
	host: getFaucetHost('testnet'),
	recipient:
		'0xcc2bd176a478baea9a0de7a24cd927661cc6e860d5bacecb9a138ef20dbab231',
});
```

## Writing Suigar Transactions

Standard Suigar games use `client.suigar.tx.createBetTransaction(gameId, options)` for `coinflip`, `limbo`, `plinko`, `range`, and `wheel`.

The SDK throws `RangeError` when the connected network, selected standard game,
PvP action, or configured coin type is unsupported for the active config.

```ts
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { suigar } from '@suigar/sdk';

const client = new SuiGrpcClient({
	network: 'testnet',
	baseUrl: 'https://fullnode.testnet.sui.io:443',
}).$extend(suigar());

const tx = client.suigar.tx.createBetTransaction('coinflip', {
	playerAddress: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	side: 'heads',
});

const base64 = await client.suigar.serializeTransactionToBase64(tx);
console.log({ base64 });
```

Configure partner attribution once during extension setup. `partner` must be the partner wallet address.

```ts
const client = new SuiGrpcClient({
	network: 'testnet',
	baseUrl: 'https://fullnode.testnet.sui.io:443',
}).$extend(suigar({ partner: '0xpartner_wallet_address' }));
```

Configure SDK-managed on-chain read caching with `cacheTtl`, in milliseconds.
The default is 30 minutes. This cache is used by on-chain reads such as
`getGameParameters`.

```ts
const client = new SuiGrpcClient({ network, baseUrl }).$extend(
	suigar({ cacheTtl: 30 * 60 * 1000 }),
);
```

Read typed on-chain game parameters with `getGameParameters(game, options?)`.
Use this when an app needs current game bounds such as min/max stake or
game-specific configuration limits. The SDK first reads the selected game's
settings object from SweetHouse, then reads that game's coin-specific
`Parameters<T>` object, parses it with the generated game type, and caches the
parsed result.

When a returned parameter field is a generated Move float struct, such as
`min_target_multiplier`, `max_target_multiplier`, `min_rtp`, or `max_rtp`, use
`fromMoveFloat()` before treating it as a normal JavaScript number.

```ts
const parameters = await client.suigar.getGameParameters('coinflip', {
	coinType: '0x2::sui::SUI',
});

console.log(parameters.min_stake);
```

Pass `ignoreCache: true` to refresh the on-chain read and replace the cached
value.

## Standard Game APIs

Use `createBetTransaction(gameId, options)` for standard games:

- `coinflip`: `side: 'heads' | 'tails'`
- `limbo`: `targetMultiplier: number`, `scale?: number`
- `plinko`: `configId: number`
- `range`: `leftPoint: number`, `rightPoint: number`, `outOfRange?: boolean`, `scale?: number`
- `wheel`: `configId: number`

Shared options include `playerAddress`, `coinType`, `stake`, optional `cashStake`, optional `betCount`, optional `metadata`, optional `gasBudget`, and optional `allowGasCoinShortcut`.

`stake` is the logical wager passed into the Move call. Use `cashStake` only when the withdrawn balance should differ from the logical stake. Pass plain application values to `metadata`; the SDK encodes metadata into on-chain byte arrays.

```ts
const limboTx = client.suigar.tx.createBetTransaction('limbo', {
	playerAddress: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	targetMultiplier: 2.5,
});

const rangeTx = client.suigar.tx.createBetTransaction('range', {
	playerAddress: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	leftPoint: 25,
	rightPoint: 75,
	outOfRange: false,
});
```

## PvP Coinflip APIs

PvP coinflip uses `client.suigar.tx.createPvPCoinflipTransaction(action, options)` for `create`, `join`, and `cancel`.

Create a public PvP coinflip lobby:

```ts
const tx = client.suigar.tx.createPvPCoinflipTransaction('create', {
	playerAddress: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	side: 'heads',
	isPrivate: false,
});
```

Join a PvP coinflip lobby:

```ts
const tx = client.suigar.tx.createPvPCoinflipTransaction('join', {
	playerAddress: '0x123',
	coinType: '0x2::sui::SUI',
	gameId: '0xGAME_ID',
});
```

Cancel a PvP coinflip lobby:

```ts
const tx = client.suigar.tx.createPvPCoinflipTransaction('cancel', {
	playerAddress: '0x123',
	coinType: '0x2::sui::SUI',
	gameId: '0xGAME_ID',
});
```

List unresolved PvP coinflip lobbies:

```ts
const games = await client.suigar.getPvPCoinflipGames({ limit: 20 });

for (const game of games) {
	console.log(game.id);
	console.log(game.coin_type);
}
```

Fetch one live PvP coinflip game object with the generated BCS helper:

```ts
const game = await client.suigar.bcs.PvPCoinflipGame.get({
	client,
	objectId: '0xGAME_ID',
});
```

## Reading Events

Generated event decoders are available under `client.suigar.bcs`. Parser helpers such as `parseGameEvent`, `parseGameDetails`, `fromMoveFloat`, `fromMoveI64`, and `parseCoinType` are exported from `@suigar/sdk/utils`.

```ts
import {
	fromMoveFloat,
	parseGameDetails,
	parseGameEvent,
} from '@suigar/sdk/utils';

const { gameId, eventName } = parseGameEvent(event)!;
const decoded = client.suigar.bcs.BetResultEvent.parse(event.bcs);
const parsedDetails = parseGameDetails(gameId, decoded.game_details);
const price = fromMoveFloat(decoded.adjusted_oracle_usd_coin_price);
```

## Useful Package Docs

- [`packages/sdk/README.md`](packages/sdk/README.md) contains the complete package API guide.
- [`apps/playground/README.md`](apps/playground/README.md) documents the integration playground.
- [`AGENTS.md`](AGENTS.md) documents repository conventions for AI-assisted development.
