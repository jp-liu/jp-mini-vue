module.exports = {
  extends: '@antfu',
  rules: {
    'no-console': 0,
    'no-debugger': process.NODE_ENV === 'production' ? 2 : 0,
    'camelcase': 0,
    'no-void': 0,
    'lines-between-class-members': 0,
    'no-unused-expressions': 0,
    'no-unused-vars': [
      'error',
      // we are only using this rule to check for unused arguments since TS
      // catches unused variables but not args.
      { varsIgnorePattern: '.*', args: 'none' },
    ],
    'no-new-func': 0,
  },
}
