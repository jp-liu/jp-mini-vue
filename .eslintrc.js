module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: ['standard', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: ['**/*.spec.ts'],
      env: {
        jest: true
      }
    }
  ],
  rules: {
    'no-debugger': process.NODE_ENV === 'production' ? 2 : 0,
    camelcase: 0,
    'no-void': 0,
    'lines-between-class-members': 0,
    'no-unused-expressions': 0,
    'no-unused-vars': [
      'error',
      // we are only using this rule to check for unused arguments since TS
      // catches unused variables but not args.
      { varsIgnorePattern: '.*', args: 'none' }
    ]
  }
}
