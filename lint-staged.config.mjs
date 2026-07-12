export default {
	'packages/*/{src,test,scripts}/**/*.{ts,tsx,js,mjs,cjs}': [
		'oxlint --fix',
		'prettier --write --ignore-unknown',
	],
	'packages/*/*.{ts,tsx,js,mjs,cjs}': [
		'oxlint --fix',
		'prettier --write --ignore-unknown',
	],
	'./*.{ts,tsx,js,mjs,cjs}': [
		'oxlint --fix',
		'prettier --write --ignore-unknown',
	],
	'playground/**/*.{ts,tsx,js,mjs,cjs}': [
		'oxlint --fix',
		'prettier --write --ignore-unknown',
	],
	'*.{json,md,yml,yaml}': 'prettier --write --ignore-unknown',
};
