typescript-simple
======

Simple API to compile TypeScript code string to JavaScript. That's all!

[![npm version][npm-image]][npm-url]
[![npm downloads][npm-downloads-image]][npm-url]
![Node.js Version Support][node-version]
[![build status][circleci-image]][circleci-url]
[![windows build status][appveyor-image]][appveyor-url]
[![dependency status][deps-image]][deps-url]
![License][license]

## Description

`typescript-simple` provides just one method that accepts TypeScript code string and returns JavaScript code.

### Why?

* TypeScript v1.4 doesn't have simple TS string to JS string API
* TypeScript v1.5 has [ts.transpile()](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#a-simple-transform-function), but it cannot generate source map
* TypeScript v1.6+ has [ts.transpile()](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#a-simple-transform-function) with source map, but it always ignores type checking

## Versioning

* typescript-simple v8.x.x uses TypeScript v2.2 - v2.7
* typescript-simple v7.x.x uses TypeScript v2.1
* typescript-simple v6.x.x uses TypeScript v2.0
* typescript-simple v5.x.x uses TypeScript v1.8
* typescript-simple v4.x.x uses TypeScript v1.7
* typescript-simple v3.x.x uses TypeScript v1.6
* typescript-simple v2.x.x uses TypeScript v1.5
* typescript-simple v1.x.x uses TypeScript v1.4

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

Specify [CompilerOptions](https://github.com/Microsoft/TypeScript/blob/0f67f4b6f1589756906782f1ac02e6931e1cff13/lib/typescript.d.ts#L1445-L1500) at 2nd argument.

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

### JSX (.tsx)

- `--jsx=preserve`

```javascript
var jsx = tss.compile('var foo: any = <Foo />;', {jsx: ts.JsxEmit.Preserve});
console.log(jsx); // 'var foo = <Foo />;'
```

- `--jsx=react`

```javascript
var tss = new TypeScriptSimple({jsx: ts.JsxEmit.React}, false);
var js = tss.compile('var foo: any = <Foo />;');
console.log(js); // 'var foo = React.createElement("Foo", null);'
```

Note: Ignore semantic errors if you use `JsxEmit.React`.

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
[travis-image]: https://img.shields.io/travis/teppeis/typescript-simple/master.svg
[travis-url]: https://travis-ci.org/teppeis/typescript-simple
[deps-image]: https://img.shields.io/david/teppeis/typescript-simple.svg
[deps-url]: https://david-dm.org/teppeis/typescript-simple
[node-version]: https://img.shields.io/badge/Node.js%20support-v4,v6,v8-brightgreen.svg
[coverage-image]: https://img.shields.io/coveralls/teppeis/typescript-simple/master.svg
[coverage-url]: https://coveralls.io/github/teppeis/typescript-simple?branch=master
[license]: https://img.shields.io/npm/l/typescript-simple.svg
[appveyor-image]: https://ci.appveyor.com/api/projects/status/22nwyfaf5p0yw54j/branch/master?svg=true
[appveyor-url]: https://ci.appveyor.com/project/teppeis/typescript-simple/branch/master
[circleci-image]: https://circleci.com/gh/teppeis/typescript-simple.svg?style=svg
[circleci-url]: https://circleci.com/gh/teppeis/typescript-simple
