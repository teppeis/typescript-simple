/// <reference path="typings/node/node.d.ts" />
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
         * @param {string} only needed if you plan to use sourceMaps. Provide the complete filePath relevant to you
         * @return {string} The JavaScript with inline sourceMaps if sourceMaps were enabled
         */
        compile(code: string, filename = FILENAME_TS): string {
            if (!this.service) {
                this.service = this.createService();
            }

            var file = this.files[FILENAME_TS];
            file.text = code;
            file.version++;

            return this.toJavaScript(this.service, filename);
        }

        private createService(): ts.LanguageService {
            var defaultLib = this.getDefaultLibFilename(this.options);
            var defaultLibPath = path.join(this.getTypeScriptBinDir(), defaultLib);
            this.files[defaultLib] = { version: 0, text: fs.readFileSync(defaultLibPath).toString() };
            this.files[FILENAME_TS] = { version: 0, text: '' };

            var servicesHost: ts.LanguageServiceHost = {
                getScriptFileNames: () => [this.getDefaultLibFilename(this.options), FILENAME_TS],
                getScriptVersion: (filename) => this.files[filename] && this.files[filename].version.toString(),
                getScriptSnapshot: (filename) => {
                    var file = this.files[filename];
                    return {
                        getText: (start, end) => file.text.substring(start, end),
                        getLength: () => file.text.length,
                        getLineStartPositions: () => [],
                        getChangeRange: (oldSnapshot) => undefined
                    };
                },
                getCurrentDirectory: () => process.cwd(),
                getScriptIsOpen: () => true,
                getCompilationSettings: () => this.options,
                getDefaultLibFilename: (options: ts.CompilerOptions) => {
                    return this.getDefaultLibFilename(options);
                },
                log: (message) => console.log(message)
            };

            return ts.createLanguageService(servicesHost, ts.createDocumentRegistry())
        }

        private getTypeScriptBinDir(): string {
            return path.dirname(require.resolve('typescript'));
        }

        private getDefaultLibFilename(options: ts.CompilerOptions): string {
            if (options.target === ts.ScriptTarget.ES6) {
                return 'lib.es6.d.ts';
            } else {
                return 'lib.d.ts';
            }
        }

        /**
         * converts {"version":3,"file":"file.js","sourceRoot":"","sources":["file.ts"],"names":[],"mappings":"AAAA,IAAI,CAAC,GAAG,MAAM,CAAC"}
         * to {"version":3,"sources":["foo/test.ts"],"names":[],"mappings":"AAAA,IAAI,CAAC,GAAG,MAAM,CAAC","file":"foo/test.ts","sourcesContent":["var x = 'test';"]}
         * derived from : https://github.com/thlorenz/convert-source-map
         */
        private getInlineSourceMap(mapText: string, filename: string): string {
            var sourceMap = JSON.parse(mapText);
            sourceMap.file = filename;
            sourceMap.sources = [filename];
            sourceMap.sourcesContent = [this.files[FILENAME_TS].text];
            delete sourceMap.sourceRoot;
            return JSON.stringify(sourceMap);
        }

        private toJavaScript(service: ts.LanguageService, filename = FILENAME_TS): string {
            var output = service.getEmitOutput(FILENAME_TS);

            // Meaning of succeeded is driven by whether we need to check for semantic errors or not
            var succeeded = output.emitOutputStatus === ts.EmitReturnStatus.Succeeded;
            if (!this.doSemanticChecks && !succeeded) {
                // We have an output. It implies syntactic success
                succeeded = !!output.outputFiles.length;
            }

            if (!succeeded) {
                var allDiagnostics = service.getCompilerOptionsDiagnostics()
                    .concat(service.getSyntacticDiagnostics(FILENAME_TS));

                if (this.doSemanticChecks) {
                    allDiagnostics = allDiagnostics.concat(service.getSemanticDiagnostics(FILENAME_TS));
                }

                throw new Error(this.formatDiagnostics(allDiagnostics));
            }

            var outputFilename = FILENAME_TS.replace(/ts$/, 'js');
            var file = output.outputFiles.filter((file) => file.name === outputFilename)[0];
            // TODO: Fixed in v1.5 https://github.com/Microsoft/TypeScript/issues/1653
            var text = file.text.replace(/\r\n/g, os.EOL);

            // If we have sourceMaps convert them to inline sourceMaps
            if (this.options.sourceMap) {
                var sourceMapFilename = FILENAME_TS.replace(/ts$/, 'js.map');
                var sourceMapFile = output.outputFiles.filter((file) => file.name === sourceMapFilename)[0];

                // Transform sourcemap
                var sourceMapText = sourceMapFile.text;
                sourceMapText = this.getInlineSourceMap(sourceMapText, filename);
                var base64SourceMapText = new Buffer(sourceMapText).toString('base64');
                var sourceMapComment = '//# sourceMappingURL=data:application/json;base64,' + base64SourceMapText;
                text = text.replace('//# sourceMappingURL=' + sourceMapFilename, sourceMapComment);
            }

            return text;
        }

        private formatDiagnostics(diagnostics: ts.Diagnostic[]): string {
            return diagnostics.map((d) => {
                if (d.file) {
                    return 'L' + d.file.getLineAndCharacterFromPosition(d.start).line + ': ' + d.messageText;
                } else {
                    return d.messageText;
                }
            }).join(os.EOL);
        }
    }
}

var defaultTss = new tss.TypeScriptSimple();

export = tss;
