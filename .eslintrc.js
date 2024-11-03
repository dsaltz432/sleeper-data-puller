module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:import/recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['import'],
  rules: {
    'max-len': [
      'off',
      {
        code: 120,
        ignoreUrls: true,
        ignoreComments: false,
        ignoreRegExpLiterals: true,
        ignoreStrings: false,
        ignoreTemplateLiterals: false,
      },
    ],
    'import/order': [1, { groups: ['builtin', 'external', 'internal', 'sibling', 'parent', 'index'] }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'never',
      exports: 'never',
      functions: 'only-multiline',
    }],
    'comma-spacing': ['error', { before: false, after: true }],
    'indent': ['error', 2, { SwitchCase: 1 }],
    'no-unused-vars': ['warn'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-function-paren': ['error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'never',
    }],
    'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    'no-multiple-empty-lines': ['error', { max: 2 }],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts', '.tsx', '.jsx', '.d.ts'],
      },
    },
  },
};
