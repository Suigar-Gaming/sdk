# `@suigar/sdk`

TypeScript SDK for building Suigar v2 game transactions on Sui.

## Documentation

For complete SDK documentation, visit [suigar.com/docs/sdk](https://suigar.com/docs/sdk).

For Sui client, transaction, and network APIs, visit the [Sui TypeScript SDK docs](https://sdk.mystenlabs.com/).

## Installation

```bash
npm install --save @suigar/sdk @mysten/sui @mysten/bcs
```

Runtime requirements:

- Node.js `^22.18.0 || >=24.0.0`
- ESM project configuration (`"type": "module"`)
- `@mysten/sui` v2
- `@mysten/bcs` v2

This SDK targets Sui TypeScript SDK 2.0+ only. Follow the official [Sui 2.0 migration guide](https://sdk.mystenlabs.com/sui/migrations/sui-2.0) if your app still uses the pre-2.0 client API.

## What This Package Exposes

The package ships three public entrypoints:

- `@suigar/sdk` for the extension factory, runtime client class, and core SDK types
- `@suigar/sdk/games` for game-specific public types
- `@suigar/sdk/utils` for public parser, constants, and numeric helpers

The package root exposes the extension factory, client class, and core SDK types:

```ts
import {
	suigar,
	SuigarClient,
	SUPPORTED_SUI_NETWORKS,
	type SuigarCoin,
	type SuigarNetwork,
} from '@suigar/sdk';
```

It does not export the individual transaction builders from the package root. Those stay on the registered extension instance under `client.suigar.tx`.

Utility exports are available from the utils subpath:

```ts
import {
	DEFAULT_GAS_BUDGET_MIST,
	DEFAULT_LIMBO_MULTIPLIER_SCALE,
	DEFAULT_QUERY_LIMIT,
	DEFAULT_RANGE_SCALE,
	fromMoveFloat,
	fromMoveI64,
	isMoveFloat,
	isMoveI64,
	parseCoinType,
	parseGameDetails,
	RANGE_POINT_LIMIT,
	toBigInt,
	toU8,
	toU16,
} from '@suigar/sdk/utils';
```

Numeric helper behavior:

- `DEFAULT_QUERY_LIMIT` is `50`, the reusable SDK default page size for paginated queries; `getPvPCoinflipGames()` currently uses it when called without options
- `toBigInt(value)` accepts `bigint`, finite `number`, non-negative integer `string`, and `boolean` inputs and returns a normalized non-negative `bigint` while throwing `TypeError` for invalid input shapes and `RangeError` for negative values
- `toU8(value)` accepts a finite integer `number` or plain integer `string` in the inclusive `0..255` range, throwing `TypeError` for non-numeric input and `RangeError` for booleans, fractional values, or out-of-range integers
- `toU16(value)` accepts a finite integer `number` or plain integer `string` in the inclusive `0..65535` range, throwing `TypeError` for non-numeric input and `RangeError` for booleans, fractional values, or out-of-range integers
- `fromMoveI64(value)` converts a generated Move `i64` wrapper into a JavaScript `number`
- `fromMoveFloat(value)` converts a generated Move float struct into a JavaScript `number`; `getGameParameters()` already applies this conversion to all float fields, including nested game configs
- `isMoveI64(value)` checks whether an unknown value has the generated Move `i64` shape
- `isMoveFloat(value)` checks whether an unknown value has the generated Move float shape
- `parseCoinType(type)` extracts the normalized first generic coin type from a Move object type string and throws `TypeError` when no coin type can be parsed
- `parseGameDetails(gameId, gameDetails)` decodes standard `BetResultEvent.game_details` byte arrays into the expected string, number, and boolean values while preserving the original on-chain keys

Game-specific type exports are available from the dedicated `games` subpath:

```ts
import { GAMES } from '@suigar/sdk/games';
import type {
	CoinflipTransactionOptions,
	CoinSide,
	CreatePvPCoinflipTransactionOptions,
	Game,
	PvPCoinflipAction,
	PvPGame,
	StandardGame,
} from '@suigar/sdk/games';
```

Current game-type subpath exports:

- `@suigar/sdk/games`: `GAMES`, `Game`, `StandardGame`, `PvPGame`, `CoinSide`, `PvPCoinflipAction`, `CreateGameBetOptions`, `CoinflipTransactionOptions`, `LimboTransactionOptions`, `PlinkoTransactionOptions`, `RangeTransactionOptions`, `SoccerTransactionOptions`, `WheelTransactionOptions`, `CreatePvPCoinflipTransactionOptions`, `JoinPvPCoinflipTransactionOptions`, `CancelPvPCoinflipTransactionOptions`

What you actually use at runtime is the registered extension instance:

```ts
const client = new SuiGrpcClient({ baseUrl, network }).$extend(suigar());

client.suigar.serializeTransactionToBase64(...);
client.suigar.getConfig();
client.suigar.getPvPCoinflipGames(...);
client.suigar.tx;
client.suigar.bcs;
```

## Quick Start

```ts
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { suigar } from '@suigar/sdk';

const client = new SuiGrpcClient({
	baseUrl: 'https://fullnode.testnet.sui.io:443',
	network: 'testnet',
}).$extend(suigar());

const tx = client.suigar.tx.createGameBet('coinflip', {
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	side: 'heads',
});

const base64 = await client.suigar.serializeTransactionToBase64(tx);
```

## Extension Registration

### `suigar(options?)`

Creates a named Sui client extension. By default, it registers under `client.suigar`.

The extension constructor throws `RangeError` when the connected client network is not one of the SDK's supported Sui networks.

### Partner Setup

> **Important:** `partner` is the partner wallet address. Configure it once when you register the extension so the SDK can prepend that wallet address to supported bet metadata automatically.

```ts
const client = new SuiGrpcClient({ baseUrl, network }).$extend(
	suigar({ partner: '0xpartner_wallet_address' }),
);

client.suigar;
```

Do not pass a partner slug, label, or display name here. Use the wallet address that should receive partner attribution on-chain.

You can rename the extension:

```ts
const client = new SuiGrpcClient({ baseUrl, network }).$extend(
	suigar({ name: 'games' }),
);

client.games.tx;
client.games.bcs;
```

## Config

`suigar(options?)` resolves config from:

- internal package ids by network
- internal supported coin metadata by network
- the connected client network
- the extension name

Supported override areas:

- `name`
- `partner`
- `cacheTtl`
- `config.packageIds`
- `config.objectIds`
- `config.registryIds`
- `config.coins`

Use `config` when the application needs to patch package, singleton object, or registry ids—or supported `sui`/`usdc` coin metadata—before a new SDK release is published. Each coin entry includes its price-info object id.

Both supported coin keys accept the same partial metadata shape:

```ts
coins?: {
	sui?: { coinType?: string; decimals?: number; priceInfoObjectId?: string };
	usdc?: { coinType?: string; decimals?: number; priceInfoObjectId?: string };
};
```

```ts
const client = new SuiGrpcClient({ network, baseUrl }).$extend(
	suigar({
		config: {
			coins: {
				usdc: {
					coinType: '0xPACKAGE::usdc::USDC',
					decimals: 6,
					priceInfoObjectId: '0xPYTH_PRICE_INFO',
				},
			},
		},
	}),
);
```

If `partner` is configured, the SDK automatically writes that partner wallet address into the on-chain metadata vec-map. Transaction builder options may also include `metadata`, but reserved keys such as `partner` and `referrer` are ignored with a warning when provided manually.

`cacheTtl` controls the SDK cache for on-chain reads such as parsed game parameters. It is expressed in milliseconds and defaults to 30 minutes.

## Runtime Surface

The registered extension instance exposes the main runtime surface:

- `getConfig()`
- `getGameParameters(game, { coinType, ...options })`
- `serializeTransactionToBase64(transaction, options?)`
- `getPvPCoinflipGames(options?)`
- `bcs`
- `tx`
- `view`

### `getConfig()`

Returns the resolved SDK configuration for the connected network.

This is intended mainly for debugging and inspection, for example to verify the resolved package ids or supported coin metadata for the active client network.

It includes:

- `packageIds`
- `objectIds`
- `registryIds`
- `coins`

```ts
const config = client.suigar.getConfig();
console.log(config.packageIds);
console.log(config.coins.sui.coinType);
```

### `getGameParameters(game, { coinType, ...options })`

Returns the on-chain `Parameters<T>` object for any supported game and coin type. The return type is inferred from `game`. `coinType` is required because each game has a distinct parameters object for every supported coin.

The SDK first reads the selected game's settings object from the configured SweetHouse object, then reads that game's coin-specific `Parameters<T>` object. This is useful for displaying or validating current limits such as min/max stake, house edge, or game-specific config bounds. The parsed result is cached using the extension `cacheTtl`.

Float parameter fields such as `min_target_multiplier`, `max_target_multiplier`, `min_rtp`, and `max_rtp` are returned as normal JavaScript numbers. This also applies to float multipliers nested in Plinko and Wheel configs.

```ts
const parameters = await client.suigar.getGameParameters('coinflip', {
	coinType: '0x2::sui::SUI',
});

console.log(parameters.min_stake);
```

Pass `ignoreCache: true` to refresh the on-chain read and replace the cached value.

### `serializeTransactionToBase64(transaction, options?)`

Builds a transaction with the configured Sui client and returns base64-encoded transaction bytes.

Use this when you need a transport-safe payload for a wallet, API, or external signer.

```ts
const base64 = await client.suigar.serializeTransactionToBase64(tx);
```

### `getPvPCoinflipGames(options?)`

Lists unresolved PvP coinflip games from the configured PvP registry.

This reads the registry dynamic fields for the active network and resolves each entry into parsed game state through a bulk `client.core.getObjects()` lookup. Registry membership is the unresolved-state signal: once a match is joined and resolved, the Move flow removes it from the registry and deletes the live `Game` object.

Use this when a product needs the current set of open PvP coinflip matches for browsing or lobby views.

By default, per-object fetch or parse failures are skipped so one broken or already-deleted registry entry does not reject the full lookup. Pass `throwOnError: true` if you want the call to reject instead.

Each returned entry includes the parsed game fields plus a derived `coin_type` string from the underlying Move object type.

When called without options, this returns the first `DEFAULT_QUERY_LIMIT` entries (`50`). Any supported `listDynamicFields()` options such as `limit`, `cursor`, or `signal` can be passed through `options`; provide `limit: DEFAULT_QUERY_LIMIT` explicitly when combining the SDK default page size with another option.

```ts
import { DEFAULT_QUERY_LIMIT } from '@suigar/sdk/utils';

const games = await client.suigar.getPvPCoinflipGames({
	limit: DEFAULT_QUERY_LIMIT,
});

for (const game of games) {
	console.log(game.id);
	console.log(game.coin_type);
}
```

```ts
const games = await client.suigar.getPvPCoinflipGames({
	limit: 20,
	throwOnError: true,
});
```

## `tx`

Transaction builders live under `client.suigar.tx`.

### Standard Games

Use `createGameBet(gameId, options)` for:

- `coinflip`
- `limbo`
- `plinko`
- `range`
- `soccer`
- `wheel`

```ts
const tx = client.suigar.tx.createGameBet('coinflip', {
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	side: 'tails',
});
```

Shared option shape:

- `owner: string`
- `coinType: string`
- `stake: number | bigint`
- `cashStake?: number | bigint`
- `betCount?: number | bigint`
- `metadata?: Record<string, string | number | boolean | bigint | Uint8Array | number[] | null | undefined>`
- `gasBudget?: number | bigint`
- `useGasCoin?: boolean`

Shared behavior:

- `stake` is the logical stake passed into the Move call
- `cashStake` controls the withdrawn balance and defaults to `stake`
- `betCount` defaults to `1`
- `metadata` is encoded into `keys` and `values` byte arrays
- `partner` configured via `suigar({ partner })` is prepended automatically to metadata as the partner wallet address
- `metadata.partner` and `metadata.referrer` are reserved and ignored with a warning
- the SDK resolves the price info object from the configured supported-coin mapping
- bet coin inputs are built from the owner's balance with Mysten coin intent helpers, using `coinType`, `cashStake`, and optional `useGasCoin`; omit `useGasCoin` to use Mysten's default behavior
- the reward object is transferred back to `owner`

Error behavior:

- `RangeError` when `gameId` is unsupported
- `RangeError` when `coinType` is not in the resolved supported-coin config for the active network
- `RangeError` when a Plinko or Wheel `configId` is not a `u8` integer (`0..255`)
- `RangeError` when a Soccer `configId` or `shotZoneId` is not a `u8` integer (`0..255`), or its `countryId` is not a `u16` integer (`0..65535`)
- `TypeError` when those selection values are not finite numbers or plain integer strings

Per-game options:

- `coinflip`: `side: 'heads' | 'tails'`
- `limbo`: `targetMultiplier: number`, `scale?: number`
- `plinko`: `configId: number`
- `range`: `leftPoint: number`, `rightPoint: number`, `outOfRange?: boolean`, `scale?: number`
- `soccer`: `configId: number`, `countryId: number`, `shotZoneId: number`
- `wheel`: `configId: number`

Examples:

```ts
const limboTx = client.suigar.tx.createGameBet('limbo', {
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	targetMultiplier: 2.5,
});

const rangeTx = client.suigar.tx.createGameBet('range', {
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	leftPoint: 25,
	rightPoint: 75,
	outOfRange: false,
});
```

> **Note:**
>
> - `limbo` converts `targetMultiplier` with `Math.round(targetMultiplier * scale)`
> - With the default `limbo` scale `100`, exposed as `DEFAULT_LIMBO_MULTIPLIER_SCALE`, a target multiplier of `2.5` becomes `250` on-chain
> - `range` converts each point with `Math.round(value * scale)`
> - `range` points are bounded by the contract limit exposed as `RANGE_POINT_LIMIT`
> - With the default `range` scale `1_000_000`, exposed as `DEFAULT_RANGE_SCALE`, valid UI values are `0` to `100`
> - `plinko`, `soccer`, and `wheel` `configId` values must fit in `u8`; `soccer` `countryId` must fit in `u16`, and `shotZoneId` must fit in `u8`

> **Tip:**
>
> - If you set `scale` to `10_000_000`, valid UI values become `0` to `10`
> - Do not pre-scale `range` points before passing them to the SDK; pass the human value and let the SDK scale it once

### PvP Games

#### PvP Coinflip

Use the action-specific `pvpCoinflip` builders for PvP coinflip flows:

- `createGame`
- `joinGame`
- `cancelGame`

Create:

```ts
const tx = client.suigar.tx.pvpCoinflip.createGame({
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	side: 'heads',
	isPrivate: false,
});
```

Join:

```ts
const tx = client.suigar.tx.pvpCoinflip.joinGame({
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	gameId: '0xGAME_ID',
});
```

Cancel:

```ts
const tx = client.suigar.tx.pvpCoinflip.cancelGame({
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	gameId: '0xGAME_ID',
});
```

PvP coinflip create builds the stake coin from the owner's balance with Mysten coin intent helpers. Join derives the stake from `gameId` and uses the configured price info object id for `coinType`. Omit `useGasCoin` to use Mysten's default coin intent behavior.

PvP shared options:

- `owner: string`
- `coinType: string`
- `metadata?: Record<string, string | number | boolean | bigint | Uint8Array | number[] | null | undefined>`
- `gasBudget?: number | bigint`
- `useGasCoin?: boolean`

Action-specific options:

- `createGame`: `stake`, `side`, `isPrivate?`
- `joinGame`: `gameId`
- `cancelGame`: `gameId`

Error behavior:

- `RangeError` when `coinType` is not in the resolved supported-coin config for the active network

### Referral claims

Referrers can claim commission accrued for any supported wager coin, and separately claim their USD-denominated level-up reward in the configured dollar coin (`coins.usdc`). Each builder sets `owner` as the transaction sender and transfers the returned claim coin back to that same address.

```ts
const commissionClaim = client.suigar.tx.referral.claimCommission({
	owner: '0xREFERRER',
	coinType: '0x2::sui::SUI',
});

const levelUpClaim = client.suigar.tx.referral.claimLevelUpUsdRewards({
	owner: '0xREFERRER',
});
```

The owner must sign the transaction: the Move contract derives the referrer from the transaction sender. `claimLevelUpUsdRewards` supplies the configured USDC type and its Pyth price-info object automatically. A claim can still abort when no referrer or coin-specific balance exists, the rakeback pool lacks funds, or the oracle check fails.

Use `view.referral` to simulate the complete claim transaction and return its atomic payout without changing chain state:

```ts
const commissionAmount = await client.suigar.view.referral.getCommission({
	owner: '0xREFERRER',
	coinType: '0x2::sui::SUI',
});
const levelUpUsdcAmount =
	await client.suigar.view.referral.getLevelUpUsdRewards({
		owner: '0xREFERRER',
	});
```

The deployed referral contract does not expose public balance getters. These simulated reads execute the same pool and oracle checks as a real claim, so they can fail for the same reasons and can change before execution.

### NFT V1

#### Reading NFTs

- Use `packageIds.nftV1` as the network-specific NFT V1 package ID.
- Derive the owned-NFT type with `client.suigar.bcs.NftV1.typeTag({ package: client.suigar.getConfig().packageIds.nftV1 })` instead of constructing the Move type manually.
- Use `objectIds.nftV1Factory` to fetch the NFT V1 catalog with `content: true`, then decode it with `client.suigar.bcs.NftV1Factory.parse(object.content)`.
- Decode owned NFTs with `client.suigar.bcs.NftV1.parse(object.content)`.

#### Minting

Mint an NFT V1 directly to the transaction sender with a factory specification ID. The transaction resolves the configured factory for that specification's SUI price when built, then resolves the NFT package and SweetHouse object from SDK configuration:

```ts
const transaction = client.suigar.tx.nftV1.mint({
	owner: accountAddress,
	specId: '0xNFT_SPEC_ID',
});
```

## `bcs`

BCS helpers live under `client.suigar.bcs`.

Current exposed helpers:

- `PvPCoinflipGame`
- `BetResultEvent`
- `PvPCoinflipGameCreatedEvent`
- `PvPCoinflipGameResolvedEvent`
- `PvPCoinflipGameCancelledEvent`
- `ReferrerClaimCommissionBalanceEvent`
- `ReferrerClaimLevelUpUsdRewardsEvent`

These are generated Move event decoders. Use them to parse Suigar event payloads from transaction results. The `@suigar/sdk/utils` subpath also exposes parser helpers for generated BCS values:

- `PvPCoinflipGame` parses a PvP coinflip game object's `content`
- `fromMoveI64(float.exp)` converts a generated Move `i64` exponent to a JavaScript number
- `fromMoveFloat(float)` converts a generated Move `Float` struct to a JavaScript number
- `parseCoinType(type)` extracts the normalized coin type from generic Move object type strings such as PvP coinflip `Game<T>` and throws `TypeError` when the type string does not include a first generic coin type
- `parseGameDetails(gameId, game_details)` decodes `BetResultEvent.game_details` entries into the expected string, number, and boolean values

### Parse PvP Coinflip Game Object Data

Use the generated BCS helper when you want to fetch and parse a game object:

```ts
const game = await client.suigar.bcs.PvPCoinflipGame.get({
	client,
	objectId: '0xGAME_ID',
});

console.log(game.json);
```

### Parse Standard Bet Result Data

```ts
const executeResult = await client.core.executeTransaction({
	transaction: transactionBytes,
	signatures: [signature],
	include: {
		events: true,
	},
});

const finalResult = await client.core.waitForTransaction({
	result: executeResult,
	include: {
		effects: true,
		events: true,
	},
});

if (finalResult.$kind === 'FailedTransaction') {
	throw new Error(finalResult.FailedTransaction.status.error?.message);
}

console.log(finalResult.Transaction.digest);

const transactionResult = finalResult.Transaction;

const betResults = [];

for (const event of transactionResult.events ?? []) {
	try {
		const decoded = client.suigar.bcs.BetResultEvent.parse(event.bcs);
		betResults.push(decoded);
	} catch {
		// Ignore non-BetResultEvent payloads.
	}
}
```

Parsed fields include:

- `player`
- `coin_type`
- `stake_amount`
- `unsafe_oracle_usd_coin_price`
- `adjusted_oracle_usd_coin_price`
- `outcome_amount`
- `game_details`
- `metadata`

`game_details` and `metadata` decode as `VecMap<string, vector<u8>>`-shaped data, so values come back as byte arrays. Use `parseGameEvent(event)` from `@suigar/sdk/utils` to retrieve the normalized `gameId` and `eventName`, then pass that `gameId` to `parseGameDetails(gameId, decoded.game_details)` for game-specific key and value typing.

```ts
import { parseGameDetails, parseGameEvent } from '@suigar/sdk/utils';

const { gameId, eventName } = parseGameEvent(event)!;
const decoded = client.suigar.bcs.BetResultEvent.parse(event.bcs);
const gameDetails = parseGameDetails(gameId, decoded.game_details);
```

`parseGameDetails` preserves the on-chain keys and only changes the value representation. For example, coinflip details keep keys such as `player_bet` and `coin_outcome`; range details keep keys such as `roll_value`, `win`, and `payout_multiplier`.

`parseGameDetails(gameId, decoded.game_details)` narrows based on the parsed event game id. For example, when `gameId === 'coinflip'` it narrows to:

- `{ player_bet: string; coin_outcome: string }`

`parseGameEvent(event)` returns the normalized game id and raw Move event name for every supported Suigar event in `GAME_EVENTS`:

- `{ gameId: 'coinflip' | 'limbo' | 'plinko' | 'range' | 'soccer' | 'wheel', eventName: 'BetResultEvent' }` for standard bet result events
- `{ gameId: 'pvp-coinflip', eventName: 'BetResultEvent' | 'GameCreatedEvent' | 'GameResolvedEvent' | 'GameCancelledEvent' }` for PvP coinflip events
- `null` for unsupported event names or non-Suigar event payloads

When the extension is configured with `partner`, decoded event `metadata` will contain that partner wallet address under the `partner` entry.

> **Important:**
>
> - Execute or wait for the transaction with `include: { events: true }`
> - Unwrap the core API union with `result.$kind`, `result.Transaction`, and `result.FailedTransaction`
> - Parse emitted events from the unwrapped transaction result
> - Use `event.bcs` for consistent decoding across transports
> - Use `const { gameId } = parseGameEvent(event)!` and then `parseGameDetails(gameId, decoded.game_details)` instead of hand-decoding standard game detail byte arrays

> **Tip:**
>
> - `waitForTransaction({ result, include: { effects: true, events: true } })` is useful when you want the finalized transaction result before decoding
> - These helpers decode the event payload itself, not a full transaction response

### Parse PvP Coinflip Event Data

Use the matching helper for each PvP coinflip event payload found in `transactionResult.events`:

- `client.suigar.bcs.PvPCoinflipGameCreatedEvent`
- `client.suigar.bcs.PvPCoinflipGameResolvedEvent`
- `client.suigar.bcs.PvPCoinflipGameCancelledEvent`

## Development

From the repository root:

```bash
pnpm install
pnpm --dir packages/sdk run build
pnpm --dir packages/sdk run typecheck
pnpm --dir packages/sdk run test
```

Build without regenerating contract bindings:

```bash
pnpm --dir packages/sdk run build:ci
```

Refresh package configuration and regenerate Move contract bindings:

```bash
pnpm --dir packages/sdk run codegen
```

Run linting and formatting checks:

```bash
pnpm --dir packages/sdk run lint
pnpm --dir packages/sdk run lint:fix
```
