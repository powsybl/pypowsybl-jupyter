module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
    ],
    env: {
        browser: true,
    },
    rules: {
        'prettier/prettier': 'warn',
        '@typescript-eslint/no-unused-vars': [
            'warn',
            { args: 'none', varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/no-explicit-any': 'off',
    },
};
