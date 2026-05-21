export function parseError(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return 'Unknown error';
}
