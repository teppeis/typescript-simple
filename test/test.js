var assert = require('assert');
var fs = require('fs');
var path = require('path');

var ts = require('typescript');
var tss = require('../');

describe('typescript-simple', function() {
    it('compiles correct code', function() {
        var src = "var x: number = 1;";
        var expected = 'var x = 1;\n';
        assert.equal(tss(src), expected);
    });

    it('throws an error', function() {
        var src = "var x: number = 'str';";
        assert.throws(function() {
            tss(src);
        }, /^Error: L1: Type 'string' is not assignable to type 'number'./);
    });

    it('compile ES6 feature', function() {
        var src = "let x: number = 1;";
        var expected = 'let x = 1;\n';
        assert.equal(tss(src, {target: ts.ScriptTarget.ES6}), expected);
    });

    it('throws an error for ES6 feature with non ES6 target', function() {
        var src = "let x: number = 1;";
        assert.throws(function() {
            tss(src);
        }, /^Error: L1: 'let' declarations are only available when targeting ECMAScript 6 and higher./);
    });
});
