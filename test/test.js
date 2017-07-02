var assert = require('assert');
var fs = require('fs');
var path = require('path');
var eol = require('os').EOL;

var ts = require('typescript');
var tss = require('../');
var TypeScriptSimple = tss.TypeScriptSimple;

describe('typescript-simple', function() {
    describe('constructor', function() {
        it('accepts no arguments', function() {
            var sut = new TypeScriptSimple();
            assert(sut instanceof TypeScriptSimple);
        });
        it('accepts null as options', function() {
            var sut = new TypeScriptSimple(null);
            assert(sut instanceof TypeScriptSimple);
        });
    });
    context('default target (ES5)', function() {
        it('compiles correct code', function() {
            var src = "var x: number = 1;";
            var expected = 'var x = 1;' + eol;
            assert.equal(tss(src), expected);
        });

        it('does not replace CRLF literal', function() {
            var src = "var x: string = '\\r\\n';";
            var expected = "var x = '\\r\\n';" + eol;
            assert.equal(tss(src), expected);
        });

        it('compiles many times', function() {
            var src = "var x: number = 1;";
            var expected = 'var x = 1;' + eol;
            assert.equal(tss(src), expected);

            src = "var y: number = 2;";
            expected = 'var y = 2;' + eol;
            assert.equal(tss(src), expected);

            src = "var z: number = 3;";
            expected = 'var z = 3;' + eol;
            assert.equal(tss(src), expected);
        });

        it('throws an error for a type error', function() {
            var src = "var x: number = 'str';";
            assert.throws(function() {
                tss(src);
            // TypeScript 2.1 bug?
            // }, /^Error: L0: Type 'string' is not assignable to type 'number'./);
            }, /^Error: L0: Type '"str"' is not assignable to type 'number'./);
        });

        it('compiles ES2015 "let" to "var"', function() {
            var src = 'let x: number = 1;';
            var expected = 'var x = 1;' + eol;
            assert.equal(tss(src), expected);
        });

        it('throws an error for ES2015 Promise', function() {
            var src = "var x = new Promise(function (resolve, reject) {\n});";
            assert.throws(function() {
                tss(src);
            // }, /^Error: L0: Cannot find name 'Promise'./);
            }, /^Error: L0: 'Promise' only refers to a type, but is being used as a value here./);

        });

        it('throws an error for ES2016 Array#includes', function() {
            var src = "var x = [1, 2, 3].includes(2);";
            assert.throws(function() {
                tss(src);
            }, /^Error: L0: Property 'includes' does not exist on type 'number\[]'./);
        });

        it('throws an error for ES2017 Object#values', function() {
            var src = "var x = Object.values({});";
            assert.throws(function() {
                tss(src);
            }, /^Error: L0: Property 'values' does not exist on type 'ObjectConstructor'./);
        });
    });

    context('target ES2015', function() {
        var tss;
        beforeEach(function() {
            tss = new TypeScriptSimple({target: ts.ScriptTarget.ES2015});
        });

        it('compiles ES2015 "let" to "let"', function() {
            var src = "let x: number = 1;";
            var expected = 'let x = 1;' + eol;
            assert.equal(tss.compile(src), expected);
        });

        it('does not throw for ES2015 Promise', function() {
            var src = "var x = new Promise(function (resolve, reject) {" + eol + "});";
            var expected = src + eol;
            assert.equal(tss.compile(src), expected);
        });
    });

    context('target ES2016', function() {
        var tss;
        beforeEach(function() {
            tss = new TypeScriptSimple({target: ts.ScriptTarget.ES2016});
        });

        it('compiles ES2016 Array#includes', function() {
            var src = "var x = [1, 2, 3].includes(2);";
            var expected = src + eol;
            assert.equal(tss.compile(src), expected);
        });
    });

    context('target ES2017', function() {
        var tss;
        beforeEach(function() {
            tss = new TypeScriptSimple({target: ts.ScriptTarget.ES2017});
        });

        it('throws an error for ES2017 Object#values', function() {
            var src = "var x = Object.values({});";
            var expected = src + eol;
            assert.equal(tss.compile(src), expected);
        });
    });

    context('semantic vs. syntactic errors', function() {
        var tss;
        beforeEach(function() {
            tss = new TypeScriptSimple({target: ts.ScriptTarget.ES5}, false);
        });

        it('semantic errors are ignored', function() {
            var src = "var x: number = 'some string';";
            var expected = "var x = 'some string';" + eol;
            assert.equal(tss.compile(src), expected);
        });
        
        it('reference imports are ignored', function() {
            var src = "/// <reference path='./typings/tsd'/>" + eol
                    + "var x: number = 'some string';";
            var expected = "/// <reference path='./typings/tsd'/>" + eol
                    + "var x = 'some string';" + eol;
            assert.equal(tss.compile(src), expected);
        });

        it('syntactic errors are not ignored', function() {
            var src = "var x = 123 123;";
            assert.throws(function() {
                tss.compile(src);
            }, /^Error: L0: ',' expected./);
        });
    });

    context('`sourceMap` option is true', function() {
        var tss;
        beforeEach(function() {
            tss = new TypeScriptSimple({target: ts.ScriptTarget.ES5, sourceMap: true}, false);
        });

        it('should result in `inlineSourceMap', function() {
            var src = 'var x = "test";';
            var srcFile = 'foo/test.ts';
            var sourceMap = '{"version":3,"file":"test.js","sources":["test.ts"],"sourceRoot":"","names":[],"mappings":"AAAA,IAAI,CAAC,GAAG,MAAM,CAAC"}';
            var expectedPrefix = 'var x = "test";' + eol + '//# sourceMappingURL=data:application/json;base64,';
            var actual = tss.compile(src, srcFile);
            var match = /(^[\s\S]*;base64,)(.*)$/.exec(actual);
            assert(match);
            assert.equal(match[1], expectedPrefix);
            assert.deepEqual(JSON.parse(new Buffer(match[2], 'base64').toString()), JSON.parse(sourceMap));
        });
    });

    context('native `inlineSourceMap` option is true', function() {
        var tss;
        beforeEach(function() {
            tss = new TypeScriptSimple({target: ts.ScriptTarget.ES5, inlineSourceMap: true, inlineSources: true}, false);
        });

        it('should result in inline sourceMap', function() {
            var src = 'var x = "test";';
            var srcFile = 'foo/test.ts';
            var sourceMap = '{"version":3,"file":"test.js","sourceRoot":"","sources":["test.ts"],"names":[],"mappings":"AAAA,IAAI,CAAC,GAAG,MAAM,CAAC","sourcesContent":["var x = \\"test\\";"]}';
            var expectedPrefix = 'var x = "test";' + eol + '//# sourceMappingURL=data:application/json;base64,';
            var actual = tss.compile(src, srcFile);
            var match = /(^[\s\S]*;base64,)(.*)$/.exec(actual);
            assert(match);
            assert.equal(match[1], expectedPrefix);
            assert.deepEqual(JSON.parse(new Buffer(match[2], 'base64').toString()), JSON.parse(sourceMap));
        });
    });

    context('tss outDir option is specified', function() {
        var tss;
        beforeEach(function() {
            tss = new TypeScriptSimple({outDir: 'built/'}, false);
        });

        it('compares output file names with the name with outDir', function() {
            var src = "var x = 123;";
            assert.doesNotThrow(function() {
                tss.compile(src);
            });
        });
    });

    context('tss outDir and rootDir options are specified', function() {
        var tss;
        beforeEach(function() {
            tss = new TypeScriptSimple({outDir: 'built/', rootDir: 'src'}, false);
        });

        it('compares output file names with the name with outDir without rootDir', function() {
            var src = "var x = 123;";
            assert.doesNotThrow(function() {
                tss.compile(src, 'src/file.ts');
            });
        });
    });

    describe('JSX', function() {
        it('compiles JSX string (Preserve)', function() {
            var tss = new TypeScriptSimple({jsx: ts.JsxEmit.Preserve});
            var src = 'var foo: any = <bar />;';
            var expected = 'var foo = <bar />;' + eol;
            assert.equal(tss.compile(src), expected);
        });

        it('compiles JSX string (React)', function() {
            var tss = new TypeScriptSimple({jsx: ts.JsxEmit.React}, false);
            var src = 'var foo: any = <bar />;';
            var expected = 'var foo = React.createElement("bar", null);' + eol;
            assert.equal(tss.compile(src), expected);
        });

        it('should result in inline sourceMap', function() {
            var tss = new TypeScriptSimple({jsx: ts.JsxEmit.Preserve, sourceMap: true});
            var src = 'var foo: any = <bar />;';
            var srcFile = 'foo/test.tsx';
            var sourceMap = '{"version":3,"file":"test.jsx","sourceRoot":"","sources":["test.tsx"],"names":[],"mappings":"AAAA,IAAI,GAAG,GAAQ,CAAC,GAAG,GAAG,CAAC"}';
            var expectedPrefix = 'var foo = <bar />;' + eol + '//# sourceMappingURL=data:application/json;base64,';
            var actual = tss.compile(src, srcFile);
            var match = /(^[\s\S]*;base64,)(.*)$/.exec(actual);
            assert(match);
            assert.equal(match[1], expectedPrefix);
            assert.deepEqual(JSON.parse(new Buffer(match[2], 'base64').toString()), JSON.parse(sourceMap));
        });
    });

    it('compiles source with an absolute path', function() {
      var tss = new TypeScriptSimple();
      var src = "let x: number = 1;";
      var expected = 'var x = 1;' + eol;
      assert.equal(tss.compile(src, path.join(__dirname, 'module.ts')), expected);
    });

    it('compiles source multiple times with relative and absolute path (#47)', function() {
      var tss = new TypeScriptSimple({});
      var src = "var x: number = 1;";
      var expected = 'var x = 1;' + eol;
      assert.equal(tss.compile(src, path.join(__dirname, 'module.ts')), expected);
      assert.equal(tss.compile(src, path.join('test', 'module.ts')), expected);
    });

    it('compiles source with `types`', function() {
      var tss = new TypeScriptSimple({types: ['node']});
      var src = "var x: number = 1;";
      var expected = 'var x = 1;' + eol;
      assert.equal(tss.compile(src), expected);
    });

    it('compiles source with `declaratoin` enabled', function() {
      var tss = new TypeScriptSimple({declaration: true});
      var src = "var x: number = 1;";
      var expected = 'var x = 1;' + eol;
      assert.equal(tss.compile(src), expected);
    });
});
