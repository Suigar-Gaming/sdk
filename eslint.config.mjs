import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const handwrittenFiles = [
	'src/**/*.ts',
	'test/**/*.ts',
	'*.config.{js,mjs,ts}',
	'*.ts',
];

export default tseslint.config(
	{
		ignores: [
			'dist/**',
			'node_modules/**',
			'examples/game-integration/**',
			'src/contracts/**',
			'.changeset/*.md',
		],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: handwrittenFiles,
		rules: {
			'no-undef': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					varsIgnorePattern: '^_',
					argsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
		},
	},
	{
		files: ['*.cjs'],
		languageOptions: {
			sourceType: 'commonjs',
			globals: {
				module: 'readonly',
				require: 'readonly',
			},
		},
	},
	{
		files: ['test/**/*.ts', 'vitest.config.ts'],
		languageOptions: {
			globals: {
				describe: 'readonly',
				expect: 'readonly',
				it: 'readonly',
			},
		},
	},
);
