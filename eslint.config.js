import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'public/draco', 'scripts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // `localStorage` throws outright in Safari private mode, so the reads
      // and writes around it are deliberately guarded by an empty catch.
      'no-empty': ['error', { allowEmptyCatch: true }],
      // A leading underscore marks a prop kept for the component's shape but
      // not read — the convention already used across these components.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // shadcn/ui components are vendored in, not hand-maintained here. They
    // legitimately export variant helpers beside their components, which is
    // all the fast-refresh rule is objecting to.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/purity': 'off',
    },
  },
  {
    // The viewer reaches into three.js internals that carry no public types:
    // three-mesh-bvh augments `BufferGeometry.prototype` at runtime, and the
    // optional PBR maps are absent from the base material union. `any` is the
    // documented escape hatch for both.
    files: ['src/three/engine.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
])
