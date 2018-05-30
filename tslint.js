'use strict';

const importESLintConfig = require('tslint-import-eslint-config');

module.exports = importESLintConfig({
  extends: ['teppeis/node-v6', 'teppeis/prettier'],
});

Object.assign(module.exports.rules, {
});
