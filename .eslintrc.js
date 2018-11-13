module.exports = {
    'env': {
        'browser': true,
        'commonjs': true,
        'amd': true,
        'es6': true
    },
    'parserOptions': {
        'ecmaVersion': 2017,
        'sourceType': 'module'
    },
    'rules': {
        camelcase: 0,
        semi: ['error', 'always'],
        'brace-style': ['error', '1tbs', { allowSingleLine: true }],
        'eol-last': ['error', 'always'],
        'keyword-spacing': ['error', { after: true }],
        'no-console': 'error',
        'no-else-return': ['error', { allowElseIf: true }],
        'no-multi-assign': 0,
        'no-restricted-globals': 0,
        'no-script-url': 0,
        'no-trailing-spaces': ['error', { skipBlankLines: true }],
        'object-curly-spacing': ['error', 'always', { arraysInObjects: true, objectsInObjects: true }],
        'one-var': ['error', { initialized: 'never', uninitialized: 'always' }],
        'prefer-destructuring': 0,
        'space-in-parens': ['error', 'never'],
        'space-infix-ops': 'error',
        'space-unary-ops': 'error',
        'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 1 }],
        'indent': [
            'error',
            'tab'
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'always'
        ]
    }
};