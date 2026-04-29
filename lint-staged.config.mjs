export default {
	'packages/sdk/{src,test,scripts}/**/*.{ts,tsx,js,mjs,cjs}': [
		'eslint --fix',
		'prettier --write',
	],
	'packages/sdk/*.{ts,tsx,js,mjs,cjs}': ['eslint --fix', 'prettier --write'],
	'./*.{ts,tsx,js,mjs,cjs}': ['eslint --fix', 'prettier --write'],
	'apps/playground/**/*.{ts,tsx,js,mjs,cjs}': [
		'eslint --fix',
		'prettier --write',
	],
	'*.{json,md,yml,yaml}': 'prettier --write',
};
