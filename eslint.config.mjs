import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const tsconfigRootDir = import.meta.dirname;

const handwrittenFiles = [
	'packages/*/src/**/*.ts',
	'packages/*/src/**/*.tsx',
	'packages/*/test/**/*.ts',
	'packages/*/scripts/**/*.mjs',
	'packages/*/*.config.{js,mjs,ts}',
	'packages/*/*.ts',
	'*.config.{js,mjs,ts}',
	'*.ts',
];

export default tseslint.config(
	{
		ignores: [
			'dist/**',
			'packages/*/dist/**',
			'node_modules/**',
			'playground/**',
			'.changeset/*.md',
		],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: handwrittenFiles,
		languageOptions: {
			parserOptions: {
				tsconfigRootDir,
			},
		},
		rules: {
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
		files: ['packages/*/src/contracts/**/*.ts'],
		rules: {
			'@typescript-eslint/no-empty-object-type': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
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
		files: ['packages/*/test/**/*.ts', 'packages/*/vitest.config.ts'],
		languageOptions: {
			globals: {
				describe: 'readonly',
				expect: 'readonly',
				it: 'readonly',
			},
		},
	},
);
