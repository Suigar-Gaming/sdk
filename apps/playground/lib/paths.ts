const pagesBasePath = process.env.PAGES_BASE_PATH ?? '';

export function withBasePath(assetPath: string): string {
	if (/^(?:[a-z]+:)?\/\//i.test(assetPath) || assetPath.startsWith('data:')) {
		return assetPath;
	}

	const normalizedPath = assetPath.startsWith('/')
		? assetPath
		: `/${assetPath}`;
	return `${pagesBasePath}${normalizedPath}`;
}
