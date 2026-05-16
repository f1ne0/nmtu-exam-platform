/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-refresh', 'import'],
  settings: {
    'import/resolver': {
      typescript: { project: './tsconfig.app.json' },
    },
  },
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': 'warn',
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          { target: './src/shared', from: './src/entities' },
          { target: './src/shared', from: './src/features' },
          { target: './src/shared', from: './src/widgets' },
          { target: './src/shared', from: './src/pages' },
          { target: './src/shared', from: './src/app' },
          { target: './src/entities', from: './src/features' },
          { target: './src/entities', from: './src/widgets' },
          { target: './src/entities', from: './src/pages' },
          { target: './src/entities', from: './src/app' },
          { target: './src/features', from: './src/widgets' },
          { target: './src/features', from: './src/pages' },
          { target: './src/features', from: './src/app' },
          { target: './src/widgets', from: './src/pages' },
          { target: './src/widgets', from: './src/app' },
          { target: './src/pages', from: './src/app' },
        ],
      },
    ],
  },
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules', 'vite.config.ts'],
};
