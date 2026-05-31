function normalizeBasePath(value: string): string {
	const trimmedValue = value.trim().replace(/\/+$/, '');

	if (!trimmedValue) {
		return '';
	}

	return trimmedValue.startsWith('/') ? trimmedValue : `/${trimmedValue}`;
}

export const basePath = normalizeBasePath(process.env.BASE_PATH ?? '');

export function withBasePath(assetPath: string): string {
	if (/^(?:[a-z]+:)?\/\//i.test(assetPath) || assetPath.startsWith('data:')) {
		return assetPath;
	}

	const normalizedPath = assetPath.startsWith('/')
		? assetPath
		: `/${assetPath}`;
	return `${basePath}${normalizedPath}`;
}
