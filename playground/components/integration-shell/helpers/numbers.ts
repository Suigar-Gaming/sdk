export function clampNumber(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

export function formatInputNumber(value: number) {
	if (!Number.isFinite(value)) {
		return '0';
	}

	const rounded = Math.round(value * 1_000_000) / 1_000_000;
	return Number.isInteger(rounded)
		? String(rounded)
		: rounded.toString().replace(/0+$/, '').replace(/\.$/, '');
}
