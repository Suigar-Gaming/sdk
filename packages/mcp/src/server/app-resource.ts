// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { readFile } from 'node:fs/promises';
import { RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';

export const SUIGAR_MCP_APP_RESOURCE_URI =
	'ui://suigar/transaction-inspector.html';

export const NFT_IMAGE_RESOURCE_DOMAINS = [
	'https://suigar-mainnet-nft.s3.eu-west-1.amazonaws.com',
] as const;

export const MCP_LOGIN_CONNECT_DOMAINS = ['http://127.0.0.1:*'] as const;

export const createSuigarMcpAppResourceMeta = () => ({
	ui: {
		csp: {
			connectDomains: [...MCP_LOGIN_CONNECT_DOMAINS],
			resourceDomains: [...NFT_IMAGE_RESOURCE_DOMAINS],
		},
		prefersBorder: true,
	},
});

const hasErrorCode = (
	error: unknown,
	code: string,
): error is Error & { code: string } =>
	error instanceof Error &&
	'code' in error &&
	(error as { code: unknown }).code === code;

const readSuigarMcpAppHtml = async () => {
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
};

export const createSuigarMcpAppResourceResult = async () => ({
	contents: [
		{
			uri: SUIGAR_MCP_APP_RESOURCE_URI,
			mimeType: RESOURCE_MIME_TYPE,
			text: await readSuigarMcpAppHtml(),
			_meta: createSuigarMcpAppResourceMeta(),
		},
	],
});
