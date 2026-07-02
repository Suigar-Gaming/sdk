import { defineConfig } from 'react-doctor/api';

export default defineConfig({
	blocking: 'warning',
	share: false,
	noScore: true,
	ignore: {
		overrides: [
			{
				files: ['src/app/**/*'],
				rules: ['deslop/unused-file'],
			},
			{
				files: ['src/server.ts'],
				rules: ['react-doctor/mcp-tool-capability-risk'],
			},
		],
	},
	rules: {
		'deslop/unused-dependency': 'off',
	},
});
