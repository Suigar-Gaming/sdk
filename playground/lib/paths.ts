const TRAILING_SLASH_PATTERN = /\/+$/;
const ABSOLUTE_URL_PATTERN = /^(?:[a-z]+:)?\/\//i;

function normalizeBasePath(value: string): string {
	const trimmedValue = value.trim().replace(TRAILING_SLASH_PATTERN, '');

	if (!trimmedValue) {
		return '';
	}

	return trimmedValue.startsWith('/') ? trimmedValue : `/${trimmedValue}`;
}

export const basePath = normalizeBasePath(process.env.BASE_PATH ?? '');

export function withBasePath(assetPath: string): string {
	if (ABSOLUTE_URL_PATTERN.test(assetPath) || assetPath.startsWith('data:')) {
		return assetPath;
	}

	const normalizedPath = assetPath.startsWith('/')
		? assetPath
		: `/${assetPath}`;
	return `${basePath}${normalizedPath}`;
}
