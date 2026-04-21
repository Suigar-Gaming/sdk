# `@suigar/sdk`

TypeScript SDK for building Suigar v2 game transactions on Sui.

The published package entrypoint currently exposes:

- `suigar`
- `SuigarClient`

It does not currently export the individual game builder functions from the package root.

## Installation

```bash
npm install @suigar/sdk
```

Runtime requirements:

- Node.js `>=22`

## Public API

```ts
import { suigar } from '@suigar/sdk';
```

### `suigar(options?)`

Creates a named Sui client extension. By default, it registers under `client.suigar`.

```ts
const client = new SuiClient({ url }).$extend(suigar());
client.suigar;
```

You can rename the extension:

```ts
const client = new SuiClient({ url }).$extend(suigar({ name: 'casino' }));

client.casino;
```

### `SuigarClient`

The registered extension instance exposes:

- `serializeTransactionToBase64(transaction)`
- `bcs.BetResultEvent`
- `tx.createBetTransaction(gameId, options)`

## Quick start

```ts
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { suigar } from '@suigar/sdk';

const client = new SuiClient({
	url: getFullnodeUrl('testnet'),
}).$extend(
	suigar({
		pyth: {
			suiPriceInfoObjectId: '0xPYTH_SUI_PRICE_INFO',
			usdcPriceInfoObjectId: '0xPYTH_USDC_PRICE_INFO',
		},
	}),
);

const tx = client.suigar.tx.createBetTransaction('coinflip', {
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	side: 'heads',
});

const base64 = await client.suigar.serializeTransactionToBase64(tx);
```

## Game transactions

`tx.createBetTransaction(gameId, options)` supports these game ids:

- `coinflip`
- `limbo`
- `plinko`
- `range`
- `wheel`

All games share this base option shape:

- `owner: string`
- `coinType: string`
- `stake: number | bigint`
- `cashStake?: number | bigint`
- `betCount?: number | bigint`
- `metadata?: Record<string, string | number | boolean | bigint | Uint8Array | number[] | null | undefined>`
- `gasBudget?: number | bigint`
- `sender?: string`
- `allowGasCoinShortcut?: boolean`

Shared behavior:

- `stake` is the logical game stake passed into the Move call
- `cashStake` is the actual coin balance withdrawn into the bet coin and defaults to `stake`
- `betCount` defaults to `1`
- `sender` overrides the transaction sender
- `metadata` is encoded into `keys` and `values` byte arrays
- the SDK resolves the Pyth price object from the configured coin mapping
- the built reward object is transferred back to the owner

### Coinflip

Additional options:

- `side: 'heads' | 'tails'`

Example:

```ts
const tx = client.suigar.tx.createBetTransaction('coinflip', {
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	side: 'tails',
});
```

### Limbo

Additional options:

- `targetMultiplier: number`
- `scale?: number`

Behavior:

- `scale` defaults to the SDK limbo multiplier scale
- `targetMultiplier` is converted with `Math.round(targetMultiplier * scale)`

Example:

```ts
const tx = client.suigar.tx.createBetTransaction('limbo', {
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	targetMultiplier: 2.5,
});
```

### Plinko

Additional options:

- `configId: number`

Behavior:

- `configId` must fit in `u8`

Example:

```ts
const tx = client.suigar.tx.createBetTransaction('plinko', {
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	configId: 3,
});
```

### Range

Additional options:

- `leftPoint: number`
- `rightPoint: number`
- `outOfRange?: boolean`
- `scale?: number`

Behavior:

- `scale` defaults to the SDK fixed-point range scale
- `leftPoint` and `rightPoint` are converted with `Math.round(value * scale)`
- `outOfRange` is coerced with `Boolean(...)`

Example:

```ts
const tx = client.suigar.tx.createBetTransaction('range', {
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	leftPoint: 0.95,
	rightPoint: 1.05,
	outOfRange: false,
});
```

### Wheel

Additional options:

- `configId: number`

Behavior:

- `configId` must fit in `u8`

Example:

```ts
const tx = client.suigar.tx.createBetTransaction('wheel', {
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	configId: 1,
});
```

## BCS helpers

The client extension also exposes a generated MoveStruct helper for Suigar bet result data:

- `client.suigar.bcs.BetResultEvent`

Use generated BCS types to parse onchain object data. Fetch the object with `include: { content: true }` and pass `object.content` to the generated type's `.parse()` method.

Always use `content`, not `objectBcs`, when parsing with generated types. The `objectBcs` field contains a full object envelope with additional metadata and is not the payload expected by the generated struct parser.

### Parse onchain object content

```ts
async function readBetResult(client: ClientWithCoreApi, id: string) {
	const { object } = await client.core.getObject({
		objectId: id,
		include: {
			content: true,
		},
	});

	const parsed = client.suigar.bcs.BetResultEvent.parse(object.content);

	console.log(parsed.player);
	console.log(parsed.coin_type.name);
	console.log(parsed.stake_amount);
	console.log(parsed.outcome_amount);

	return parsed;
}
```

### Using the generated helper directly

If you already have a content-bearing object response, parse `object.content` directly:

```ts
const { object } = await client.core.getObject({
	objectId: '0xOBJECT_ID',
	include: {
		content: true,
	},
});

const decoded = client.suigar.bcs.BetResultEvent.parse(object.content);
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

For `game_details` and `metadata`, the decoded value is a `VecMap<string, vector<u8>>`-shaped structure, so values come back as byte arrays.

Example conversion to strings:

```ts
const decoded = client.suigar.bcs.BetResultEvent.parse(object.data.content);
const textDecoder = new TextDecoder();

const metadata = new Map(
	decoded.metadata.contents.map(({ key, value }) => [
		key,
		textDecoder.decode(new Uint8Array(value)),
	]),
);
```

## Config

`suigar(options?)` resolves config from:

- the connected Sui network
- internal default package ids
- internal default SweetHouse package id by network
- default coin types for `SUI`, `USDC`, and FlowX `USDC`
- user overrides

Supported override areas:

- `name`
- `sweetHousePackageId`
- `coinTypes.sui`
- `coinTypes.usdc`
- `coinTypes.usdcFlowx`
- `gamesPackageId.coinflip`
- `gamesPackageId.limbo`
- `gamesPackageId.plinko`
- `gamesPackageId['pvp-coinflip']`
- `gamesPackageId.range`
- `gamesPackageId.wheel`
- `pyth.packageId`
- `pyth.suiPriceInfoObjectId`
- `pyth.usdcPriceInfoObjectId`
- `pyth.priceInfoObjectIds[coinType]`

Example:

```ts
const client = new SuiClient({ url }).$extend(
	suigar({
		sweetHousePackageId: '0xsweethouse',
		pyth: {
			suiPriceInfoObjectId: '0xsui',
			usdcPriceInfoObjectId: '0xusdc',
			priceInfoObjectIds: {
				'0x123::custom::TOKEN': '0xprice',
			},
		},
		gamesPackageId: {
			coinflip: '0xcoinflip',
			wheel: '0xwheel',
		},
	}),
);
```

## Development

```bash
npm run build
npm run typecheck
npm test
```
