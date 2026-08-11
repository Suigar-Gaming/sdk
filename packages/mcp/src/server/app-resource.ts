// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { readFile } from 'node:fs/promises';
import { RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';

export const SUIGAR_MCP_APP_RESOURCE_URI =
	'ui://suigar/transaction-inspector.html';

export const NFT_IMAGE_RESOURCE_DOMAINS = [
	'https://suigar-mainnet-nft.s3.eu-west-1.amazonaws.com',
] as const;

type SuigarMcpAppResourceMeta = {
	ui: {
		csp: {
			connectDomains: Array<string>;
			resourceDomains: Array<(typeof NFT_IMAGE_RESOURCE_DOMAINS)[number]>;
		};
		prefersBorder: boolean;
	};
};

export function createSuigarMcpAppResourceMeta(): SuigarMcpAppResourceMeta {
	return {
		ui: {
			csp: {
				connectDomains: [],
				resourceDomains: [...NFT_IMAGE_RESOURCE_DOMAINS],
			},
			prefersBorder: true,
		},
	};
}

function hasErrorCode(
	error: unknown,
	code: string,
): error is Error & { code: string } {
	return (
		error instanceof Error &&
		'code' in error &&
		(error as { code: unknown }).code === code
	);
}

async function readSuigarMcpAppHtml(): Promise<string> {
	try {
		return await readFile(
			new URL('../app/index.html', import.meta.url),
			'utf8',
		);
	} catch (error) {
		if (!hasErrorCode(error, 'ENOENT')) {
			throw error;
		}
		throw new Error('Unable to find bundled Suigar MCP App HTML.', {
			cause: error,
		});
	}
}

export async function createSuigarMcpAppResourceResult(): Promise<{
	contents: Array<{
		uri: string;
		mimeType: string;
		text: string;
		_meta: SuigarMcpAppResourceMeta;
	}>;
}> {
	return {
		contents: [
			{
				uri: SUIGAR_MCP_APP_RESOURCE_URI,
				mimeType: RESOURCE_MIME_TYPE,
				text: await readSuigarMcpAppHtml(),
				_meta: createSuigarMcpAppResourceMeta(),
			},
		],
	};
}
