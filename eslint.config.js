const importPlugin = require('eslint-plugin-import')
const jsxA11yPlugin = require('eslint-plugin-jsx-a11y')
const reactPlugin = require('eslint-plugin-react')
const reactHooksPlugin = require('eslint-plugin-react-hooks')

module.exports = [
  {
    ignores: [
      '.next/**',
      'docs/**',
      'node_modules/**',
      'public/**',
      'dist/**',
    ],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      import: importPlugin,
      'jsx-a11y': jsxA11yPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'import/no-unresolved': ['error', { ignore: ['\\.svg\\?react$'] }],
      'no-duplicate-imports': 'error',
      'react/display-name': 'off',
      'react/jsx-no-target-blank': 'error',
      'jsx-a11y/click-events-have-key-events': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/set-state-in-effect': 'off',
      'no-console': ['error', { allow: ['error'] }],
    },
  },
]
