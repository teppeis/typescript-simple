/// <reference path="typings/node/node.d.ts" />
/// <reference path="typings/typescript/typescript.d.ts" />

import fs = require('fs');
import os = require('os');
import path = require('path');

import ts = require('typescript');

var FILENAME_TS = 'file.ts';
 
/**
 * @param {string} contents TypeScript source code to compile
 * @param {ts.CompilerOptions} compilerOptions TypeScript compile options (some options are ignored)
 */
function compile(contents: string, compilerOptions: ts.CompilerOptions = {}) {
    if (compilerOptions.target == null) {
        compilerOptions.target = ts.ScriptTarget.ES3;
    }
    if (compilerOptions.module == null) {
        compilerOptions.module = ts.ModuleKind.None;
    }

    var outputs = {};
    var compilerHost = {
        getSourceFile: function(filename, languageVersion) {
            if (filename === FILENAME_TS) {
                return ts.createSourceFile(filename, contents, languageVersion, '0');
            } else if (/^lib(?:\.es6)?\.d\.ts$/.test(filename)) {
                var libPath = path.join(path.dirname(require.resolve('typescript')), filename);
                var libSource = fs.readFileSync(libPath).toString();
                return ts.createSourceFile(filename, libSource, languageVersion, '0');
            }
            return undefined;
        },
        writeFile: function(name, text, writeByteOrderMark) {
            outputs[name] = text;
        },
        getDefaultLibFilename: function(options) {
            if (options.target === ts.ScriptTarget.ES6) {
                return 'lib.es6.d.ts';
            } else {
                return 'lib.d.ts';
            }
        },
        useCaseSensitiveFileNames: function() { return true; },
        getCanonicalFileName: function(filename) { return filename; },
        getCurrentDirectory: function() { return ''; },
        getNewLine: function() { return os.EOL; }
    };
    var program = ts.createProgram([FILENAME_TS], compilerOptions, compilerHost);
    var errors = program.getDiagnostics();
    if (!errors.length) {
        var checker = program.getTypeChecker(true);
        errors = checker.getDiagnostics();
        checker.emitFiles();
    }

    if (errors.length > 0) {
        throw new Error(errors.map(formatError).join(os.EOL));
    }

    return outputs[FILENAME_TS.replace(/ts$/, 'js')];
}

function formatError(e) {
    return 'L' + e.file.getLineAndCharacterFromPosition(e.start).line + ': ' + e.messageText;
}

module.exports = compile;
