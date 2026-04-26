import path from 'node:path';
import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const explicitPagesBasePath = process.env.PAGES_BASE_PATH;

function normalizeBasePath(value: string): string {
	if (!value) {
		return '';
	}

	return value.startsWith('/') ? value : `/${value}`;
}

const basePath =
	explicitPagesBasePath !== undefined
		? normalizeBasePath(explicitPagesBasePath)
		: isGitHubPages && repositoryName.length > 0
			? `/${repositoryName}`
			: '';

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
