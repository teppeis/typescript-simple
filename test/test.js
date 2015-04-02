var assert = require('assert');
var fs = require('fs');
var path = require('path');
var eol = require('os').EOL;

var ts = require('typescript');
var tss = require('../');
var TypeScriptSimple = tss.TypeScriptSimple;

describe('typescript-update', function() {
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
            }, /^Error: L0: Type 'string' is not assignable to type 'number'./);
        });

        it('compiles ES6 "let" to "var"', function() {
            var src = 'let x: number = 1;';
            var expected = 'var x = 1;' + eol;
            assert.equal(tss(src), expected);
        });

        it('throws an error for ES6 Promise', function() {
            var src = "var x = new Promise(function (resolve, reject) {\n});";
            assert.throws(function() {
                tss(src);
            }, /^Error: L0: Cannot find name 'Promise'./);
        });
    });

    context('target ES6', function() {
        var tss;
        beforeEach(function() {
            tss = new TypeScriptSimple({target: ts.ScriptTarget.ES6});
        });

        it('compiles ES6 "let" to "let"', function() {
            var src = "let x: number = 1;";
            var expected = 'let x = 1;' + eol;
            assert.equal(tss.compile(src), expected);
        });

        it('does not throw for ES6 Promise', function() {
            var src = "var x = new Promise(function (resolve, reject) {" + eol + "});";
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

        it('syntactic errors are not ignored', function() {
            var src = "var x = 123 123;";
            assert.throws(function() {
                tss.compile(src);
            }, /^Error: L0: ',' expected./);
        });
    });

    context('sourceMaps', function() {
        var tss;
        beforeEach(function() {
            tss = new TypeScriptSimple({target: ts.ScriptTarget.ES5, sourceMap: true}, false);
        });

        it('sourceMap:true should result in inline sourceMaps', function() {
            var src = 'var x = "test";';
            var srcFile = 'foo/test.ts';
            var expected =
                'var x = "test";' + eol
                + '//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9vL3Rlc3QudHMiLCJzb3VyY2VzIjpbImZvby90ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbInZhciB4ID0gXCJ0ZXN0XCI7Il19';
            assert.equal(tss.compile(src, srcFile), expected);
        });
    });
});
