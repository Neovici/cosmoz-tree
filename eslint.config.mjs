import cfg from '@neovici/cfg/eslint/index.mjs';

export default [
	...cfg,
	{
		rules: {
			'max-lines-per-function': 'off',
			'import/group-exports': 'off',
		},
	},
	{
		files: ['test/**/*.js', 'test/**/*.ts'],
		rules: {
			'mocha/max-top-level-suites': 'off',
			'mocha/no-top-level-hooks': 'off',
			'mocha/no-setup-in-describe': 'off',
			'mocha/consistent-spacing-between-blocks': 'off',
		},
	},
	{ ignores: ['coverage/**', 'dist/**'] },
];
