import { defineConfig } from 'react-doctor/api';

export default defineConfig({
	blocking: 'warning',
	share: false,
	noScore: true,
	rules: {
		'deslop/unused-dependency': 'off',
	},
});
