import path from 'node:path';
import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const basePath =
	isGitHubPages && repositoryName.length > 0 ? `/${repositoryName}` : '';

const nextConfig: NextConfig = {
	output: 'export',
	trailingSlash: true,
	basePath,
	images: {
		unoptimized: true,
	},
	turbopack: {
		root: path.resolve(__dirname, '..', '..'),
	},
};

export default nextConfig;
