/// <reference path="typings/node/node.d.ts" />
/// <reference path="typings/typescript/typescript.d.ts" />

import fs = require('fs');
import os = require('os');
import path = require('path');

import ts = require('typescript');

var FILENAME_TS = 'file.ts';
 
/**
 * @param {string} code TypeScript source code to compile
 * @param {ts.CompilerOptions=} options TypeScript compile options (some options are ignored)
 */
function compile(code: string, options: ts.CompilerOptions = {}) {
    if (options.target == null) {
        options.target = ts.ScriptTarget.ES3;
    }
    if (options.module == null) {
        options.module = ts.ModuleKind.None;
    }

    var outputs: {[index: string]: string} = {};
    var compilerHost = {
        getSourceFile: function(filename: string, languageVersion: ts.ScriptTarget) {
            if (filename === FILENAME_TS) {
                return ts.createSourceFile(filename, code, languageVersion, '0');
            } else if (/^lib(?:\.es6)?\.d\.ts$/.test(filename)) {
                var libPath = path.join(path.dirname(require.resolve('typescript')), filename);
                var libSource = fs.readFileSync(libPath).toString();
                return ts.createSourceFile(filename, libSource, languageVersion, '0');
            }
            return undefined;
        },
        writeFile: function(name: string, text: string, writeByteOrderMark: boolean) {
            outputs[name] = text;
        },
        getDefaultLibFilename: function(options: ts.CompilerOptions) {
            if (options.target === ts.ScriptTarget.ES6) {
                return 'lib.es6.d.ts';
            } else {
                return 'lib.d.ts';
            }
        },
        useCaseSensitiveFileNames: function() { return true; },
        getCanonicalFileName: function(filename: string) { return filename; },
        getCurrentDirectory: function() { return ''; },
        getNewLine: function() { return os.EOL; }
    };

    var program = ts.createProgram([FILENAME_TS], options, compilerHost);
    var diagnostics = program.getDiagnostics();
    if (diagnostics.length > 0) {
        throw new Error(formatDiagnostics(diagnostics));
    }

    var checker = program.getTypeChecker(true);
    diagnostics = checker.getDiagnostics();
    checker.emitFiles();
    if (diagnostics.length > 0) {
        throw new Error(formatDiagnostics(diagnostics));
    }

    return outputs[FILENAME_TS.replace(/ts$/, 'js')];
}

function formatDiagnostics(diagnostics: ts.Diagnostic[]) {
    return diagnostics.map((d) => {
        if (d.file) {
            return 'L' + d.file.getLineAndCharacterFromPosition(d.start).line + ': ' + d.messageText;
        } else {
            return d.messageText;
        }
    }).join(os.EOL);
}

module.exports = compile;
