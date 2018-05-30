'use strict';

const importESLintConfig = require('tslint-import-eslint-config');

module.exports = importESLintConfig({
  extends: ['teppeis/node-v6', 'teppeis/prettier'],
});

module.exports.extends.push('tslint-plugin-prettier');
Object.assign(module.exports.rules, {
  prettier: [true, require.resolve('eslint-config-teppeis/.prettierrc')],
});

// console.log(JSON.stringify(module.exports, null, 2));
