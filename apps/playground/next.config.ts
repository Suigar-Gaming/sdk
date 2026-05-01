import path from 'node:path';
import type { NextConfig } from 'next';
import { basePath } from './lib/paths';

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
