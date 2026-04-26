export default {
	'{src,test,scripts}/**/*.{ts,tsx,js,mjs,cjs}': [
		'eslint --fix',
		'prettier --write',
	],
	'./*.{ts,tsx,js,mjs,cjs}': ['eslint --fix', 'prettier --write'],
	'examples/game-integration/**/*.{ts,tsx,js,mjs,cjs}': [
		'eslint --fix',
		'prettier --write',
	],
	'*.{json,md,yml,yaml}': 'prettier --write',
};
