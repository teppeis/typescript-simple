'use strict';

const assert = require('assert');
const path = require('path');
const eol = require('os').EOL;
const semver = require('semver');
const pkgUp = require('pkg-up');
const ts = require('typescript');
const tss = require('../');
const TypeScriptSimple = tss.TypeScriptSimple;

describe('typescript-simple', () => {
  describe('constructor', () => {
    it('accepts no arguments', () => {
      const sut = new TypeScriptSimple();
      assert(sut instanceof TypeScriptSimple);
    });
    it('accepts null as options', () => {
      const sut = new TypeScriptSimple(null);
      assert(sut instanceof TypeScriptSimple);
    });
  });
  context('default target (ES5)', () => {
    it('compiles correct code', () => {
      const src = 'var x: number = 1;';
      const expected = `var x = 1;${eol}`;
      assert.equal(tss(src), expected);
    });

    it('does not replace CRLF literal', () => {
      const src = "var x: string = '\\r\\n';";
      const expected = `var x = '\\r\\n';${eol}`;
      assert.equal(tss(src), expected);
    });

    it('compiles many times', () => {
      let src = 'var x: number = 1;';
      let expected = `var x = 1;${eol}`;
      assert.equal(tss(src), expected);

      src = 'var y: number = 2;';
      expected = `var y = 2;${eol}`;
      assert.equal(tss(src), expected);

      src = 'var z: number = 3;';
      expected = `var z = 3;${eol}`;
      assert.equal(tss(src), expected);
    });

    it('throws an error for a type error', () => {
      const src = "var x: number = 'str';";
      assert.throws(() => {
        tss(src);
        // TypeScript 2.1 bug?
        // }, /^Error: L0: Type 'string' is not assignable to type 'number'./);
      }, /^Error: L0: Type '"str"' is not assignable to type 'number'./);
    });

    it('compiles ES2015 "let" to "var"', () => {
      const src = 'let x: number = 1;';
      const expected = `var x = 1;${eol}`;
      assert.equal(tss(src), expected);
    });

    it('throws an error for ES2015 Promise', () => {
      const src = 'var x = new Promise(function (resolve, reject) {\n});';
      assert.throws(() => {
        tss(src);
        // }, /^Error: L0: Cannot find name 'Promise'./);
      }, /^Error: L0: 'Promise' only refers to a type, but is being used as a value here./);
    });

    it('throws an error for ES2016 Array#includes', () => {
      const src = 'var x = [1, 2, 3].includes(2);';
      assert.throws(() => {
        tss(src);
      }, /^Error: L0: Property 'includes' does not exist on type 'number\[]'./);
    });

    it('throws an error for ES2017 Object#values', () => {
      const src = 'var x = Object.values({});';
      assert.throws(() => {
        tss(src);
      }, /^Error: L0: Property 'values' does not exist on type 'ObjectConstructor'./);
    });
  });

  context('target ES2015', () => {
    let tss;
    beforeEach(() => {
      tss = new TypeScriptSimple({target: ts.ScriptTarget.ES2015});
    });

    it('compiles ES2015 "let" to "let"', () => {
      const src = 'let x: number = 1;';
      const expected = `let x = 1;${eol}`;
      assert.equal(tss.compile(src), expected);
    });

    it('does not throw for ES2015 Promise', () => {
      const src = `var x = new Promise(function (resolve, reject) {${eol}});`;
      const expected = src + eol;
      assert.equal(tss.compile(src), expected);
    });
  });

  context('target ES2016', () => {
    let tss;
    beforeEach(() => {
      tss = new TypeScriptSimple({target: ts.ScriptTarget.ES2016});
    });

    it('compiles ES2016 Array#includes', () => {
      const src = 'var x = [1, 2, 3].includes(2);';
      const expected = src + eol;
      assert.equal(tss.compile(src), expected);
    });
  });

  context('target ES2017', () => {
    let tss;
    beforeEach(() => {
      tss = new TypeScriptSimple({target: ts.ScriptTarget.ES2017});
    });

    it('throws an error for ES2017 Object#values', () => {
      const src = 'var x = Object.values({});';
      const expected = src + eol;
      assert.equal(tss.compile(src), expected);
    });
  });

  context('semantic vs. syntactic errors', () => {
    let tss;
    beforeEach(() => {
      tss = new TypeScriptSimple({target: ts.ScriptTarget.ES5}, false);
    });

    it('semantic errors are ignored', () => {
      const src = "var x: number = 'some string';";
      const expected = `var x = 'some string';${eol}`;
      assert.equal(tss.compile(src), expected);
    });

    it('reference imports are ignored', () => {
      const src = `/// <reference path='./typings/tsd'/>${eol
      }var x: number = 'some string';`;
      const expected = `/// <reference path='./typings/tsd'/>${eol
      }var x = 'some string';${eol}`;
      assert.equal(tss.compile(src), expected);
    });

    it('syntactic errors are not ignored', () => {
      const src = 'var x = 123 123;';
      assert.throws(() => {
        tss.compile(src);
      }, /^Error: L0: ',' expected./);
    });
  });

  context('`sourceMap` option is true', () => {
    let tss;
    beforeEach(() => {
      tss = new TypeScriptSimple({target: ts.ScriptTarget.ES5, sourceMap: true}, false);
    });

    it('should result in `inlineSourceMap', () => {
      const src = 'var x = "test";';
      const srcFile = 'foo/test.ts';
      const sourceMap = '{"version":3,"file":"test.js","sources":["test.ts"],"sourceRoot":"","names":[],"mappings":"AAAA,IAAI,CAAC,GAAG,MAAM,CAAC"}';
      const expectedPrefix = `var x = "test";${eol}//# sourceMappingURL=data:application/json;base64,`;
      const actual = tss.compile(src, srcFile);
      const match = /(^[\s\S]*;base64,)(.*)$/.exec(actual);
      assert(match);
      assert.equal(match[1], expectedPrefix);
      assert.deepEqual(JSON.parse(Buffer.from(match[2], 'base64').toString()), JSON.parse(sourceMap));
    });
  });

  context('native `inlineSourceMap` option is true', () => {
    let tss;
    beforeEach(() => {
      tss = new TypeScriptSimple({target: ts.ScriptTarget.ES5, inlineSourceMap: true, inlineSources: true}, false);
    });

    it('should result in inline sourceMap', () => {
      const src = 'var x = "test";';
      const srcFile = 'foo/test.ts';
      const sourceMap = '{"version":3,"file":"test.js","sourceRoot":"","sources":["test.ts"],"names":[],"mappings":"AAAA,IAAI,CAAC,GAAG,MAAM,CAAC","sourcesContent":["var x = \\"test\\";"]}';
      const expectedPrefix = `var x = "test";${eol}//# sourceMappingURL=data:application/json;base64,`;
      const actual = tss.compile(src, srcFile);
      const match = /(^[\s\S]*;base64,)(.*)$/.exec(actual);
      assert(match);
      assert.equal(match[1], expectedPrefix);
      assert.deepEqual(JSON.parse(Buffer.from(match[2], 'base64').toString()), JSON.parse(sourceMap));
    });
  });

  context('tss outDir option is specified', () => {
    let tss;
    beforeEach(() => {
      tss = new TypeScriptSimple({outDir: 'built/'}, false);
    });

    it('compares output file names with the name with outDir', () => {
      const src = 'var x = 123;';
      assert.doesNotThrow(() => {
        tss.compile(src);
      });
    });
  });

  context('tss outDir and rootDir options are specified', () => {
    let tss;
    beforeEach(() => {
      tss = new TypeScriptSimple({outDir: 'built/', rootDir: 'src'}, false);
    });

    it('compares output file names with the name with outDir without rootDir', () => {
      const src = 'var x = 123;';
      assert.doesNotThrow(() => {
        tss.compile(src, 'src/file.ts');
      });
    });
  });

  describe('JSX', () => {
    it('compiles JSX string (Preserve)', () => {
      const tss = new TypeScriptSimple({jsx: ts.JsxEmit.Preserve});
      const src = 'var foo: any = <bar />;';
      const expected = `var foo = <bar />;${eol}`;
      assert.equal(tss.compile(src), expected);
    });

    it('compiles JSX string (React)', () => {
      const tss = new TypeScriptSimple({jsx: ts.JsxEmit.React}, false);
      const src = 'var foo: any = <bar />;';
      const expected = `var foo = React.createElement("bar", null);${eol}`;
      assert.equal(tss.compile(src), expected);
    });

    it('should result in inline sourceMap', () => {
      const tss = new TypeScriptSimple({jsx: ts.JsxEmit.Preserve, sourceMap: true});
      const src = 'var foo: any = <bar />;';
      const srcFile = 'foo/test.tsx';
      const sourceMap = {
        'version': 3,
        'file': 'test.jsx',
        'sourceRoot': '',
        'sources': ['test.tsx'],
        'names': [],
      };
      if (isTSVerGte('2.9.0-rc')) {
        sourceMap.mappings = 'AAAA,IAAI,GAAG,GAAQ,CAAC,GAAG,CAAC,AAAD,EAAG,CAAC';
      } else {
        sourceMap.mappings = 'AAAA,IAAI,GAAG,GAAQ,CAAC,GAAG,GAAG,CAAC';
      }
      const expectedPrefix = `var foo = <bar />;${eol}//# sourceMappingURL=data:application/json;base64,`;
      const actual = tss.compile(src, srcFile);
      const match = /(^[\s\S]*;base64,)(.*)$/.exec(actual);
      assert(match);
      assert.equal(match[1], expectedPrefix);
      assert.deepEqual(JSON.parse(Buffer.from(match[2], 'base64').toString()), sourceMap);
    });
  });

  it('compiles source with an absolute path', () => {
    const tss = new TypeScriptSimple();
    const src = 'let x: number = 1;';
    const expected = `var x = 1;${eol}`;
    assert.equal(tss.compile(src, path.join(__dirname, 'module.ts')), expected);
  });

  it('compiles source multiple times with relative and absolute path (#47)', () => {
    const tss = new TypeScriptSimple({});
    const src = 'var x: number = 1;';
    const expected = `var x = 1;${eol}`;
    assert.equal(tss.compile(src, path.join(__dirname, 'module.ts')), expected);
    assert.equal(tss.compile(src, path.join('test', 'module.ts')), expected);
  });

  it('compiles source with `types`', () => {
    const tss = new TypeScriptSimple({types: ['node']});
    const src = 'var x: number = 1;';
    const expected = `var x = 1;${eol}`;
    assert.equal(tss.compile(src), expected);
  });

  it('compiles source with `declaratoin` enabled', () => {
    const tss = new TypeScriptSimple({declaration: true});
    const src = 'var x: number = 1;';
    const expected = `var x = 1;${eol}`;
    assert.equal(tss.compile(src), expected);
  });
});

function isTSVerGte(ver) {
  const pkg = require(pkgUp.sync(path.dirname(require.resolve('typescript'))));
  return semver.gte(pkg.version, ver);
}
