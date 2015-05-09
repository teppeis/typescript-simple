typescript-simple [![npm version][npm-image]][npm-url] [![downloads][npm-downloads-image]][npm-url] [![build status][travis-image]][travis-url] [![Dependency Status][deps-image]][deps-url]
======

> Simple API to compile TypeScript code string to JavaScript. That's all!

## Description

`typescript-simple` provides just one method that accepts TypeScript code string and returns JavaScript code.

### Why?

* TypeScript v1.4 doesn't have simple TS string to JS string API
* TypeScript v1.5 has [ts.transpile()](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#a-simple-transform-function), but it cannot generate source map

## Versioning

* typescript-simple v1.x.x uses TypeScript v1.4
* typescript-simple v2.x.x uses TypeScript v1.5

Note: typescript-simple updates the major version for TypeScript's minor update including breaking changes.

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

### Compiler Options

Specify [CompilerOptions](https://github.com/Microsoft/TypeScript/blob/v1.5.0-beta/bin/typescriptServices.d.ts#L1076-L1108) at 2nd argument.

```javascript
var js = tss('var n: number = 1;', {noImplicitAny: true});
```

### Make repeated compilation faster

`tss()` with options is not best-performance-method to be executed many times.
Use `TypeScriptSimple` class for this purpose.

```javascript
var TypeScriptSimple = require('typescript-simple').TypeScriptSimple;
var tss = new TypeScriptSimple({target: ts.ScriptTarget.ES6, noImplicitAny: true});
var js1 = tss.compile('var n: number = 1;');
var js2 = tss.compile('var s: string = "foo";');
```

### Ignore semantic errors

If you don't need TypeScript *semantic* error and just want the result code, give 2nd argument of the constructor `false`.

```javascript
var tss = new TypeScriptSimple({target: ts.ScriptTarget.ES6}, false);
var js = tss.compile('var n: string = 1;'); // an error is not thrown.
```

Note: *syntactic* errors may be thrown.

### Source map

Inline source map is available.

```javascript
var tss = new TypeScriptSimple({sourceMap: true});
var js = tss.compile('var n: number = 1;', 'path/to/file.ts');
```

Output:

```javascript
var n = 1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uI...
```
Note: The path to file doesn't need to be an actual file. We just copy the contents of the passed in ts string into the inline sourceMap and make it look like the js is coming from a ts file at that file path.

## Limitations

`typescript-simple` cannot compile multiple source files.

## API

See [index.d.ts](index.d.ts).

## Contributors

* [@basarat](https://github.com/basarat)

## License

MIT License: Teppei Sato &lt;teppeis@gmail.com&gt;

[npm-image]: https://img.shields.io/npm/v/typescript-simple.svg
[npm-url]: https://npmjs.org/package/typescript-simple
[npm-downloads-image]: https://img.shields.io/npm/dm/typescript-simple.svg
[travis-image]: https://travis-ci.org/teppeis/typescript-simple.svg?branch=master
[travis-url]: https://travis-ci.org/teppeis/typescript-simple
[deps-image]: https://david-dm.org/teppeis/typescript-simple.svg
[deps-url]: https://david-dm.org/teppeis/typescript-simple
