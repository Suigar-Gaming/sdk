export function stringifyGameParameters(value: unknown) {
	return JSON.stringify(
		value,
		(_, currentValue) =>
			typeof currentValue === 'bigint' ? currentValue.toString() : currentValue,
		2,
	);
}
