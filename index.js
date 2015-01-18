/// <reference path="typings/node/node.d.ts" />
/// <reference path="node_modules/typescript/bin/typescript.d.ts" />
var fs = require('fs');
var os = require('os');
var path = require('path');
var ts = require('typescript');
var FILENAME_TS = 'file.ts';
/**
 * @param {string} code TypeScript source code to compile
 * @param {ts.CompilerOptions=} options TypeScript compile options (some options are ignored)
 */
function compile(code, options) {
    if (options === void 0) { options = {}; }
    if (options.target == null) {
        options.target = 0 /* ES3 */;
    }
    if (options.module == null) {
        options.module = 0 /* None */;
    }
    var outputs = {};
    var compilerHost = {
        getSourceFile: function (filename, languageVersion) {
            if (filename === FILENAME_TS) {
                return ts.createSourceFile(filename, code, languageVersion, '0');
            }
            else if (/^lib(?:\.es6)?\.d\.ts$/.test(filename)) {
                var libPath = path.join(path.dirname(require.resolve('typescript')), filename);
                var libSource = fs.readFileSync(libPath).toString();
                return ts.createSourceFile(filename, libSource, languageVersion, '0');
            }
            return undefined;
        },
        writeFile: function (name, text, writeByteOrderMark) {
            outputs[name] = text;
        },
        getDefaultLibFilename: function (options) {
            if (options.target === 2 /* ES6 */) {
                return 'lib.es6.d.ts';
            }
            else {
                return 'lib.d.ts';
            }
        },
        useCaseSensitiveFileNames: function () {
            return true;
        },
        getCanonicalFileName: function (filename) {
            return filename;
        },
        getCurrentDirectory: function () {
            return '';
        },
        getNewLine: function () {
            return os.EOL;
        }
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
function formatDiagnostics(diagnostics) {
    return diagnostics.map(function (d) {
        if (d.file) {
            return 'L' + d.file.getLineAndCharacterFromPosition(d.start).line + ': ' + d.messageText;
        }
        else {
            return d.messageText;
        }
    }).join(os.EOL);
}
module.exports = compile;
