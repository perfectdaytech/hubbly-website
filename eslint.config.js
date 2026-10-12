import js from '@eslint/js';

const nodeGlobals = {
  Buffer: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  clearTimeout: 'readonly',
  console: 'readonly',
  crypto: 'readonly',
  fetch: 'readonly',
  process: 'readonly',
  setTimeout: 'readonly',
};

const browserGlobals = {
  crypto: 'readonly',
  document: 'readonly',
  history: 'readonly',
  navigator: 'readonly',
  window: 'readonly',
};

export default [
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**', 'public/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: nodeGlobals,
    },
    rules: {
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
    },
  },
  {
    files: ['src/scripts/**/*.js'],
    languageOptions: {
      globals: { ...nodeGlobals, ...browserGlobals },
    },
  },
];
