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
		],
	},
});
