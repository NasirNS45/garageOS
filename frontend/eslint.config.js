import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Opinionated newer rule; these are intentional on-mount / data-accumulation
      // effects in this codebase. Keep as a warning so it surfaces without blocking CI.
      'react-hooks/set-state-in-effect': 'warn',
      // Dev-only Fast Refresh hint (e.g. ToastContext exports provider + hook).
      // Does not affect production; keep as a warning.
      'react-refresh/only-export-components': 'warn',
    },
  },
])
