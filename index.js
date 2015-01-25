/// <reference path="typings/node/node.d.ts" />
/// <reference path="node_modules/typescript/bin/typescript.d.ts" />
var fs = require('fs');
var os = require('os');
var path = require('path');
var ts = require('typescript');
var FILENAME_TS = 'file.ts';
function tss(code, options) {
    if (options) {
        return new tss.TypeScriptSimple(options).compile(code);
    }
    else {
        return defaultTss.compile(code);
    }
}
var tss;
(function (tss) {
    var TypeScriptSimple = (function () {
        /**
        * @param {ts.CompilerOptions=} options TypeScript compile options (some options are ignored)
        */
        function TypeScriptSimple(options) {
            if (options === void 0) { options = {}; }
            this.service = null;
            this.outputs = {};
            this.files = {};
            if (options.target == null) {
                options.target = 1 /* ES5 */;
            }
            if (options.module == null) {
                options.module = 0 /* None */;
            }
            this.options = options;
        }
        /**
        * @param {string} code TypeScript source code to compile
        * @return {string}
        */
        TypeScriptSimple.prototype.compile = function (code) {
            if (!this.service) {
                this.service = this.createService();
            }
            var file = this.files[FILENAME_TS];
            file.text = code;
            file.version++;
            return this.toJavaScript(this.service);
        };
        TypeScriptSimple.prototype.createService = function () {
            var _this = this;
            var defaultLib = this.getDefaultLibFilename(this.options);
            var defaultLibPath = path.join(this.getTypeScriptBinDir(), defaultLib);
            this.files[defaultLib] = { version: 0, text: fs.readFileSync(defaultLibPath).toString() };
            this.files[FILENAME_TS] = { version: 0, text: '' };
            var servicesHost = {
                getScriptFileNames: function () { return [_this.getDefaultLibFilename(_this.options), FILENAME_TS]; },
                getScriptVersion: function (filename) { return _this.files[filename] && _this.files[filename].version.toString(); },
                getScriptSnapshot: function (filename) {
                    var file = _this.files[filename];
                    return {
                        getText: function (start, end) { return file.text.substring(start, end); },
                        getLength: function () { return file.text.length; },
                        getLineStartPositions: function () { return []; },
                        getChangeRange: function (oldSnapshot) { return undefined; }
                    };
                },
                getCurrentDirectory: function () { return process.cwd(); },
                getScriptIsOpen: function () { return true; },
                getCompilationSettings: function () { return _this.options; },
                getDefaultLibFilename: function (options) {
                    return _this.getDefaultLibFilename(options);
                },
                log: function (message) { return console.log(message); }
            };
            return ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
        };
        TypeScriptSimple.prototype.getTypeScriptBinDir = function () {
            return path.dirname(require.resolve('typescript'));
        };
        TypeScriptSimple.prototype.getDefaultLibFilename = function (options) {
            if (options.target === 2 /* ES6 */) {
                return 'lib.es6.d.ts';
            }
            else {
                return 'lib.d.ts';
            }
        };
        TypeScriptSimple.prototype.toJavaScript = function (service) {
            var output = service.getEmitOutput(FILENAME_TS);
            if (output.emitOutputStatus === 0 /* Succeeded */) {
                var filename = FILENAME_TS.replace(/ts$/, 'js');
                var file = output.outputFiles.filter(function (file) { return file.name === filename; })[0];
                // Fixed in v1.5 https://github.com/Microsoft/TypeScript/issues/1653
                return file.text.replace(/\r\n/g, os.EOL);
            }
            var allDiagnostics = service.getCompilerOptionsDiagnostics().concat(service.getSyntacticDiagnostics(FILENAME_TS)).concat(service.getSemanticDiagnostics(FILENAME_TS));
            throw new Error(this.formatDiagnostics(allDiagnostics));
        };
        TypeScriptSimple.prototype.formatDiagnostics = function (diagnostics) {
            return diagnostics.map(function (d) {
                if (d.file) {
                    return 'L' + d.file.getLineAndCharacterFromPosition(d.start).line + ': ' + d.messageText;
                }
                else {
                    return d.messageText;
                }
            }).join(os.EOL);
        };
        return TypeScriptSimple;
    })();
    tss.TypeScriptSimple = TypeScriptSimple;
})(tss || (tss = {}));
var defaultTss = new tss.TypeScriptSimple();
module.exports = tss;
