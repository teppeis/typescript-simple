import fs = require('fs');
import os = require('os');
import path = require('path');
import assert = require('assert');

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
        private service: ts.LanguageService | null = null;
        private options: ts.CompilerOptions;
        private files: {[key: string]: { version: number; text: string; }} = {};

        /**
         * @param {ts.CompilerOptions=} options TypeScript compile options (some options are ignored)
         * @param {boolean=} doSemanticChecks Throw if TypeScript semantic error found (default: true)
         * @constructor
         */
        constructor(options: ts.CompilerOptions = {}, private doSemanticChecks = true) {
            options = Object.assign({}, options);
            if (options.target == null) {
                options.target = ts.ScriptTarget.ES5;
            }
            if (options.module == null) {
                options.module = ts.ModuleKind.None;
            }
            if (options.sourceMap) {
                options.sourceMap = false;
                options.inlineSourceMap = true;
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
                getScriptFileNames: () => Object.keys(this.files),
                getScriptVersion: (fileName) => this.files[fileName] && this.files[fileName].version.toString(),
                getScriptSnapshot: (fileName) => {
                    let file = this.files[fileName];
                    if (!file) {
                        // default lib
                        let defaultLibPath = path.join(this.getTypeScriptBinDir(), fileName);
                        if (fs.existsSync(defaultLibPath)) {
                            file = this.files[fileName] = {version: 0, text: fs.readFileSync(defaultLibPath).toString()};
                        }
                    }
                    if (file) {
                        return {
                            getText: (start, end) => file.text.substring(start, end),
                            getLength: () => file.text.length,
                            getLineStartPositions: (): number[] => [],
                            getChangeRange: (oldSnapshot) => undefined
                        };
                    } else {
                        // This is some reference import
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
                trace: (message: string) => console.trace(message),
                error: (message: string) => console.error(message),
                readFile: readFile,
                fileExists: fileExists
            };

            function readFile(filename: string, encoding?: string): string {
                try {
                    const content =  fs.readFileSync(filename, encoding || 'utf8');
                    return content;
                } catch (e) {
                    return '';
                }
            }

            function fileExists(filename: string): boolean {
                return readFile(filename) !== '';
            }

            return ts.createLanguageService(serviceHost, ts.createDocumentRegistry())
        }

        private getTypeScriptBinDir(): string {
            return path.dirname(require.resolve('typescript'));
        }

        private getDefaultLibFileName(options: ts.CompilerOptions): string {
            switch (options.target) {
                case ts.ScriptTarget.ES2015:
                    return 'lib.es6.d.ts';
                case ts.ScriptTarget.ES2016:
                    return 'lib.es2016.d.ts';
                case ts.ScriptTarget.ES2017:
                case ts.ScriptTarget.ESNext:
                case ts.ScriptTarget.Latest:
                    return 'lib.es2017.d.ts';
                default:
                    return 'lib.d.ts';
            }
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

            if (output.outputFiles.length === 0) {
                throw new Error('No output files');
            }
            const file = output.outputFiles[0];
            assert(/\.jsx?$/.test(file.name));

            return file.text;
        }

        private formatDiagnostics(diagnostics: ts.Diagnostic[]): string {
            return diagnostics.map((d) => {
                if (d.file && typeof d.start === 'number') {
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
