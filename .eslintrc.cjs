/** ESLint 設定: TypeScript + React 18 + a11y */
module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  ignorePatterns: [
    'dist',
    'mock',
    'node_modules',
    'coverage',
    'playwright-report',
    'test-results',
    '*.config.ts',
    '*.config.cjs',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: '18.3' },
  },
  plugins: ['react-refresh', '@typescript-eslint', 'jsx-a11y'],
  rules: {
    // any 禁止 (project-rules.md)
    '@typescript-eslint/no-explicit-any': 'error',
    // 関数の引数・戻り値の型注釈は public API のみ要求 (緩め)
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    // 未使用変数: _ プレフィックスは許容
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    // React.FC は使わない方針 (project-rules.md)
    'react/function-component-definition': 'off',
    // hooks ルール
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    // a11y: ナビボタン / トグルに aria-label 必須 (子供向けプロダクト)
    'jsx-a11y/no-autofocus': 'warn',
  },
  overrides: [
    {
      files: ['tests/**/*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
