typescript-simple [![NPM version][npm-image]][npm-url] [![build status][travis-image]][travis-url] [![Dependency Status][deps-image]][deps-url]
======

> Just compile TypeScript code string to JavaScript. That's all!

## Description

TypeScirpt 1.4 has [official compiler API](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API), but it isn't easy to compile tiny TypeScript code string.
`typescript-simple` provides just one method that accepts TypeScript code string and returns JavaScript code.


## Install

```console
$ npm install typescript-simple
```

## Usage

Simple usage (default target is ES5).

```javascript
var tss = require('typescript-simple');
var js = tss('var n: number = 1;');
console.log(js); // 'var n = 1;'
```

If the code causes errors, `typescript-simple` throws errors.

```javascript
try {
    var js = tss('var n: number = "str";');
} catch (e) {
    console.error(e); // Error: L1: Type 'string' is not assignable to type 'number'.
}
```

Specify compiler options.

```javascript
var js = tss('var n: number = 1;', {noImplicitAny: true});
```

But `tss()` with options is not best-performance-method to be called many times.
Use `TypeScriptSimple` class for the purpose.

```javascript
var tss = new tss.TypeScriptSimple({target: ts.ScriptTarget.ES6, noImplicitAny: true});
var js = tss.compile('var n: number = 1;');
```

## Limitaions

`typescript-simple` cannot compile multiple source files.

## API

See [index.d.ts](index.d.ts).

## Note

This implementation is derived from code in [an official wiki page](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API).

## License

MIT License: Teppei Sato &lt;teppeis@gmail.com&gt;

[npm-image]: https://img.shields.io/npm/v/typescript-simple.svg
[npm-url]: https://npmjs.org/package/typescript-simple
[travis-image]: https://travis-ci.org/teppeis/typescript-simple.svg?branch=master
[travis-url]: https://travis-ci.org/teppeis/typescript-simple
[deps-image]: https://david-dm.org/teppeis/typescript-simple.svg
[deps-url]: https://david-dm.org/teppeis/typescript-simple
