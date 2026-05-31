export default {
	'packages/*/{src,test,scripts}/**/*.{ts,tsx,js,mjs,cjs}': [
		'eslint --fix',
		'prettier --write',
	],
	'packages/*/*.{ts,tsx,js,mjs,cjs}': ['eslint --fix', 'prettier --write'],
	'./*.{ts,tsx,js,mjs,cjs}': ['eslint --fix', 'prettier --write'],
	'playground/**/*.{ts,tsx,js,mjs,cjs}': ['eslint --fix', 'prettier --write'],
	'*.{json,md,yml,yaml}': 'prettier --write',
};
