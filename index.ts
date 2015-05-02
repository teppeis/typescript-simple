/// <reference path="node_modules/typescript/bin/typescript.d.ts" />

import fs = require('fs');
import os = require('os');
import path = require('path');

import ts = require('typescript');

var FILENAME_TS = 'file.ts';

function tss(code: string, options: ts.CompilerOptions): string {
    if (options) {
        return new tss.TypeScriptSimple(options).compile(code);
    } else {
        return defaultTss.compile(code);
    }
}

module tss {
    export class TypeScriptSimple {
        private service: ts.LanguageService = null;
        private outputs: ts.Map<string> = {};
        private options: ts.CompilerOptions;
        private files: ts.Map<{ version: number; text: string; }> = {};

        /**
         * @param {ts.CompilerOptions=} options TypeScript compile options (some options are ignored)
         * @param {boolean=} doSemanticChecks Throw if TypeScript semantic error found (default: true)
         * @constructor
         */
        constructor(options: ts.CompilerOptions = {}, private doSemanticChecks = true) {
            if (options.target == null) {
                options.target = ts.ScriptTarget.ES5;
            }
            if (options.module == null) {
                options.module = ts.ModuleKind.None;
            }
            this.options = options;
        }

        /**
         * @param {string} code TypeScript source code to compile
         * @param {string=} fileName Only needed if you plan to use sourceMaps.
         *    Provide the complete filePath relevant to you
         * @return {string} The JavaScript with inline sourceMaps if sourceMaps were enabled
         * @throw {Error} A syntactic error or a semantic error (if doSemanticChecks is true)
         */
        compile(code: string, fileName = FILENAME_TS): string {
            if (!this.service) {
                this.service = this.createService();
            }

            var file = this.files[FILENAME_TS];
            file.text = code;
            file.version++;

            return this.toJavaScript(this.service, fileName);
        }

        private createService(): ts.LanguageService {
            var defaultLib = this.getDefaultLibFileName(this.options);
            var defaultLibPath = path.join(this.getTypeScriptBinDir(), defaultLib);
            this.files[defaultLib] = { version: 0, text: fs.readFileSync(defaultLibPath).toString() };
            this.files[FILENAME_TS] = { version: 0, text: '' };

            var serviceHost: ts.LanguageServiceHost = {
                getScriptFileNames: () => [this.getDefaultLibFileName(this.options), FILENAME_TS],
                getScriptVersion: (fileName) => this.files[fileName] && this.files[fileName].version.toString(),
                getScriptSnapshot: (fileName) => {
                    var file = this.files[fileName];
                    if (file) {
                        return {
                            getText: (start, end) => file.text.substring(start, end),
                            getLength: () => file.text.length,
                            getLineStartPositions: (): number[]=> [],
                            getChangeRange: (oldSnapshot) => undefined
                        };
                    }
                    else { // This is some reference import
                        return {
                            getText: (start, end) => '',
                            getLength: () => 0,
                            getLineStartPositions: (): number[]=> [],
                            getChangeRange: (oldSnapshot) => undefined
                        };
                    }
                },
                getCurrentDirectory: () => process.cwd(),
                getScriptIsOpen: () => true,
                getCompilationSettings: () => this.options,
                getDefaultLibFileName: (options: ts.CompilerOptions) => {
                    return this.getDefaultLibFileName(options);
                },
                getNewLine: () => os.EOL,
                log: (message: string) => console.log(message),
                trace: (message: string) => console.debug(message),
                error: (message: string) => console.error(message)
            };

            return ts.createLanguageService(serviceHost, ts.createDocumentRegistry())
        }

        private getTypeScriptBinDir(): string {
            return path.dirname(require.resolve('typescript'));
        }

        private getDefaultLibFileName(options: ts.CompilerOptions): string {
            if (options.target === ts.ScriptTarget.ES6) {
                return 'lib.es6.d.ts';
            } else {
                return 'lib.d.ts';
            }
        }

        /**
         * converts {"version":3,"file":"file.js","sourceRoot":"","sources":["file.ts"],"names":[],
         *    "mappings":"AAAA,IAAI,CAAC,GAAG,MAAM,CAAC"}
         * to {"version":3,"sources":["foo/test.ts"],"names":[],
         *    "mappings":"AAAA,IAAI,CAAC,GAAG,MAAM,CAAC","file":"foo/test.ts","sourcesContent":["var x = 'test';"]}
         * derived from : https://github.com/thlorenz/convert-source-map
         */
        private getInlineSourceMap(mapText: string, fileName: string): string {
            var sourceMap = JSON.parse(mapText);
            sourceMap.file = fileName;
            sourceMap.sources = [fileName];
            sourceMap.sourcesContent = [this.files[FILENAME_TS].text];
            delete sourceMap.sourceRoot;
            return JSON.stringify(sourceMap);
        }

        private toJavaScript(service: ts.LanguageService, fileName = FILENAME_TS): string {
            var output = service.getEmitOutput(FILENAME_TS);

            var allDiagnostics = service.getCompilerOptionsDiagnostics()
                .concat(service.getSyntacticDiagnostics(FILENAME_TS));

            if (this.doSemanticChecks) {
                allDiagnostics = allDiagnostics.concat(service.getSemanticDiagnostics(FILENAME_TS));
            }

            if (allDiagnostics.length) {
                throw new Error(this.formatDiagnostics(allDiagnostics));
            }

            var outputFileName = FILENAME_TS.replace(/ts$/, 'js');
            var file = output.outputFiles.filter((file) => file.name === outputFileName)[0];
            var text = file.text;

            // If we have sourceMaps convert them to inline sourceMaps
            if (this.options.sourceMap) {
                var sourceMapFileName = FILENAME_TS.replace(/ts$/, 'js.map');
                var sourceMapFile = output.outputFiles.filter((file) => file.name === sourceMapFileName)[0];

                // Transform sourcemap
                var sourceMapText = sourceMapFile.text;
                sourceMapText = this.getInlineSourceMap(sourceMapText, fileName);
                var base64SourceMapText = new Buffer(sourceMapText).toString('base64');
                var sourceMapComment = '//# sourceMappingURL=data:application/json;base64,' + base64SourceMapText;
                text = text.replace('//# sourceMappingURL=' + sourceMapFileName, sourceMapComment);
            }

            return text;
        }

        private formatDiagnostics(diagnostics: ts.Diagnostic[]): string {
            return diagnostics.map((d) => {
                if (d.file) {
                    return 'L' + d.file.getLineAndCharacterOfPosition(d.start).line + ': ' + d.messageText;
                } else {
                    return d.messageText;
                }
            }).join(os.EOL);
        }
    }
}

var defaultTss = new tss.TypeScriptSimple();

export = tss;
