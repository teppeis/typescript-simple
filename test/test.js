var assert = require('assert');
var fs = require('fs');
var path = require('path');

var ts = require('typescript');
var TypeScriptSimple = require('../');

describe('typescript-update', function() {
    var tss;
    context('default target (ES5)', function() {
        beforeEach(function() {
            tss = new TypeScriptSimple();
        });

        it.skip('bench', function() {
            var src = "var x: number = 1;";
            var expected = 'var x = 1;\n';
            var start = new Date().getTime();
            for (var i = 0; i < 10; i++) {
                tss = new TypeScriptSimple();
                tss.compile(src);
            }
            console.log('each time compile', (new Date() - start)/1000);

            start = new Date().getTime();
            for (var i = 0; i < 10; i++) {
                new TypeScriptSimple();
                tss.compile(src);
            }
            console.log('incremental compile', (new Date() - start)/1000);
        });

        it('compiles correct code', function() {
            var src = "var x: number = 1;";
            var expected = 'var x = 1;\n';
            assert.equal(tss.compile(src), expected);
        });

        it('does not replace CRLF literal', function() {
            var src = "var x: string = '\\r\\n';";
            var expected = "var x = '\\r\\n';\n";
            assert.equal(tss.compile(src), expected);
        });

        it('compiles many times', function() {
            var src = "var x: number = 1;";
            var expected = 'var x = 1;\n';
            assert.equal(tss.compile(src), expected);

            src = "var y: number = 2;";
            expected = 'var y = 2;\n';
            assert.equal(tss.compile(src), expected);

            src = "var z: number = 3;";
            expected = 'var z = 3;\n';
            assert.equal(tss.compile(src), expected);
        });

        it('throws an error for a type error', function() {
            var src = "var x: number = 'str';";
            assert.throws(function() {
                tss.compile(src);
            }, /^Error: L1: Type 'string' is not assignable to type 'number'./);
        });

        it('throws an error for ES6 "let"', function() {
            var src = "let x: number = 1;";
            assert.throws(function() {
                tss.compile(src);
            }, /^Error: L1: 'let' declarations are only available when targeting ECMAScript 6 and higher./);
        });

        it('throws an error for ES6 Promise', function() {
            var src = "var x = new Promise(function (resolve, reject) {\n});";
            assert.throws(function() {
                tss.compile(src);
            }, /^Error: L1: Cannot find name 'Promise'./);
        });
    });

    context('target ES6', function() {
        beforeEach(function() {
            tss = new TypeScriptSimple({target: ts.ScriptTarget.ES6});
        });

        it('compiles ES6 "let"', function() {
            var src = "let x: number = 1;";
            var expected = 'let x = 1;\n';
            assert.equal(tss.compile(src), expected);
        });

        it('compiles ES6 Promise', function() {
            var src = "var x = new Promise(function (resolve, reject) {\n});";
            var expected = src + '\n';
            assert.equal(tss.compile(src), expected);
        });
    });
});
