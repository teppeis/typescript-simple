import fs = require('fs');
import os = require('os');
import path = require('path');

import ts = require('typescript');

const FILENAME_TS = 'file.ts';
const FILENAME_TSX = 'file.tsx';

function tss(code: string, options?: ts.CompilerOptions): string {
    if (options) {
        return new tss.TypeScriptSimple(options).compile(code);
    } else {
        return defaultTss.compile(code);
    }
}

namespace tss {
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
            // accept null
            options = options || {};
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
        compile(code: string, fileName?: string): string {
            if (!fileName) {
                if (this.options.jsx === ts.JsxEmit.Preserve) {
                    fileName = FILENAME_TSX;
                } else if (this.options.jsx === ts.JsxEmit.React) {
                    fileName = FILENAME_TSX;
                } else {
                    fileName = FILENAME_TS;
                }
            }

            if (!this.service) {
                this.service = this.createService();
            }

            let file = this.files[fileName];
            if (file) {
                file.text = code;
                file.version++;
            } else {
                this.files[fileName] = { version: 0, text: code };
            }

            return this.toJavaScript(this.service, fileName);
        }

        private createService(): ts.LanguageService {
            let defaultLib = this.getDefaultLibFileName(this.options);
            let defaultLibPath = path.join(this.getTypeScriptBinDir(), defaultLib);
            this.files[defaultLib] = { version: 0, text: fs.readFileSync(defaultLibPath).toString() };

            let serviceHost: ts.LanguageServiceHost = {
                getScriptFileNames: () => [this.getDefaultLibFileName(this.options)].concat(Object.keys(this.files)),
                getScriptVersion: (fileName) => this.files[fileName] && this.files[fileName].version.toString(),
                getScriptSnapshot: (fileName) => {
                    let file = this.files[fileName];
                    if (file) {
                        return {
                            getText: (start, end) => file.text.substring(start, end),
                            getLength: () => file.text.length,
                            getLineStartPositions: (): number[] => [],
                            getChangeRange: (oldSnapshot) => undefined
                        };
                    } else { // This is some reference import
                        return {
                            getText: (start, end) => '',
                            getLength: () => 0,
                            getLineStartPositions: (): number[] => [],
                            getChangeRange: (oldSnapshot) => undefined
                        };
                    }
                },
                getCurrentDirectory: () => process.cwd(),
                getCompilationSettings: () => this.options,
                getDefaultLibFileName: (options: ts.CompilerOptions) => {
                    return this.getDefaultLibFileName(options);
                },
                // TODO: Use options.newLine
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
         * @internal
         */
        private getInlineSourceMap(mapText: string, fileName: string): string {
            let sourceMap = JSON.parse(mapText);
            sourceMap.file = fileName;
            sourceMap.sources = [fileName];
            sourceMap.sourcesContent = [this.files[fileName].text];
            delete sourceMap.sourceRoot;
            return JSON.stringify(sourceMap);
        }

        private toJavaScript(service: ts.LanguageService, fileName: string): string {
            let output = service.getEmitOutput(fileName);

            let allDiagnostics = service.getCompilerOptionsDiagnostics()
                .concat(service.getSyntacticDiagnostics(fileName));

            if (this.doSemanticChecks) {
                allDiagnostics = allDiagnostics.concat(service.getSemanticDiagnostics(fileName));
            }

            if (allDiagnostics.length) {
                throw new Error(this.formatDiagnostics(allDiagnostics));
            }

            let outDir = 'outDir' in this.options ? this.options.outDir : '.';
            let fileNameWithoutRoot = 'rootDir' in this.options ? fileName.replace(new RegExp('^' + this.options.rootDir), '') : fileName;
            let outputFileName: string;
            if (this.options.jsx === ts.JsxEmit.Preserve) {
                outputFileName = path.join(outDir, fileNameWithoutRoot.replace(/\.tsx$/, '.jsx'));
            } else {
                outputFileName = path.join(outDir, fileNameWithoutRoot.replace(/\.tsx?$/, '.js'));
            }
            // for Windows #37
            outputFileName = this.normalizeSlashes(outputFileName);
            let file = output.outputFiles.filter((file) => file.name === outputFileName)[0];
            let text = file.text;

            // If we have sourceMaps convert them to inline sourceMaps
            if (this.options.sourceMap) {
                let sourceMapFileName = outputFileName + '.map';
                let sourceMapFile = output.outputFiles.filter((file) => file.name === sourceMapFileName)[0];

                // Transform sourcemap
                let sourceMapText = sourceMapFile.text;
                sourceMapText = this.getInlineSourceMap(sourceMapText, fileName);
                let base64SourceMapText = new Buffer(sourceMapText).toString('base64');
                let sourceMapComment = '//# sourceMappingURL=data:application/json;base64,' + base64SourceMapText;
                text = text.replace('//# sourceMappingURL=' + path.basename(sourceMapFileName), sourceMapComment);
            }

            return text;
        }

        private normalizeSlashes(path: string): string {
            return path.replace(/\\/g, "/");
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

const defaultTss = new tss.TypeScriptSimple();

export = tss;
