// @ts-check
const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    // Generated output — never lint build artifacts.
    ignores: ['dist/**', '.expo/**', 'web-build/**', '.web/**'],
  },
];
