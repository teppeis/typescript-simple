typescript-simple [![NPM version][npm-image]][npm-url] [![build status][travis-image]][travis-url] [![Dependency Status][deps-image]][deps-url]
======

> Just compile TypeScript code string to JavaScript. That's all!

## Description

Simple TypeScript Compiler Service API.
TypeScirpt 1.4 has official compiler API, but it isn't easy to compile tiny TypeScript code string.
`typescript-simple` provide just one method that accepts TypeScript code string and returns JavaScript code.


## Install

```console
$ npm install typescript-simple
```

## Usage

Simple usage.

```javascript
var tsc = require('typescript-simple');
var js = tsc.compile('var n: number = 1;');
console.log(js); // 'var n = 1;'
```

Specify compiler options.

```javascript
var js = tsc.compile('var n: number = 1;', {noImplicitAny: true});
```

If the code causes errors, `typescript-simple` throws errors.

```javascript
try {
    var js = tsc.compile('var n: number = "str";');
} catch (e) {
    console.error(e); // Error: L1: Type 'string' is not assignable to type 'number'.
}
```

## API

### compile(code: string, options: typescript.CompilerOptions): string

* `code`: TypeScript input source code string
* `options`: TypeScript compiler options
* return : JavaScript output code string

Following is full compiler options, but some are ignored in the current implementation.

```typescript
interface CompilerOptions {
    allowNonTsExtensions?: boolean;
    charset?: string;
    codepage?: number;
    declaration?: boolean;
    diagnostics?: boolean;
    emitBOM?: boolean;
    help?: boolean;
    locale?: string;
    mapRoot?: string;
    module?: ModuleKind;
    noEmitOnError?: boolean;
    noErrorTruncation?: boolean;
    noImplicitAny?: boolean;
    noLib?: boolean;
    noLibCheck?: boolean;
    noResolve?: boolean;
    out?: string;
    outDir?: string;
    preserveConstEnums?: boolean;
    removeComments?: boolean;
    sourceMap?: boolean;
    sourceRoot?: string;
    suppressImplicitAnyIndexErrors?: boolean;
    target?: ScriptTarget;
    version?: boolean;
    watch?: boolean;
    [option: string]: string | number | boolean;
}
```

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
