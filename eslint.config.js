// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  // ── Global ignores ──────────────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'public/pagefind/**',
      '.lighthouseci/**',
      'src/generated/**',
      'tests/visual/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },

  // ── Base JS rules ────────────────────────────────────────────────────────
  js.configs.recommended,

  // ── TypeScript (strict mode, project-aware) ──────────────────────────────
  ...tseslint.configs.recommended,

  // ── React hooks ─────────────────────────────────────────────────────────
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // react-hooks v5 (React 19) added strict rules that flag many valid
      // existing patterns (setState in effects, Date.now in render). Disable
      // until the codebase is ready for a dedicated React 19 hygiene pass.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
    },
  },

  // ── Astro files ──────────────────────────────────────────────────────────
  ...astro.configs.recommended,

  // ── Project-wide overrides ───────────────────────────────────────────────
  {
    rules: {
      // Existing codebase uses `any` at type boundaries; downgrade to warn.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Unused vars: ignore args/vars prefixed with _ (common TS/Astro pattern).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Allow void-returning async calls (fire-and-forget event handlers).
      '@typescript-eslint/no-floating-promises': 'off',

      // Allow require() in config/script files (pure ESM in src enforced by TS).
      '@typescript-eslint/no-require-imports': 'warn',

      // Empty catch blocks are sometimes intentional (e.g. storage APIs).
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },

  // ── Node globals for config files ────────────────────────────────────────
  {
    files: ['*.mjs', '*.cjs', '*.config.*', 'scripts/**'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        URL: 'readonly',
      },
    },
  },

  // ── Prettier must be last — disables formatting-conflicting rules ─────────
  prettier,
);
