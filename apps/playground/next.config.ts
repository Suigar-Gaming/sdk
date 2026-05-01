import path from 'node:path';
import type { NextConfig } from 'next';

const explicitPagesBasePath = process.env.PAGES_BASE_PATH;

function normalizeBasePath(value: string): string {
	const trimmedValue = value.trim().replace(/\/+$/, '');

	if (!trimmedValue) {
		return '';
	}

	return trimmedValue.startsWith('/') ? trimmedValue : `/${trimmedValue}`;
}

const basePath =
	explicitPagesBasePath === undefined
		? ''
		: normalizeBasePath(explicitPagesBasePath);

const nextConfig: NextConfig = {
	output: 'export',
	trailingSlash: true,
	basePath,
	env: {
		PAGES_BASE_PATH: basePath,
	},
	images: {
		unoptimized: true,
	},
	turbopack: {
		root: path.resolve(__dirname, '..', '..'),
	},
};

export default nextConfig;
