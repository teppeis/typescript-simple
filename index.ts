/// <reference path="typings/node/node.d.ts" />
/// <reference path="node_modules/typescript/bin/typescript.d.ts" />

import fs = require('fs');
import os = require('os');
import path = require('path');

import ts = require('typescript');

var FILENAME_TS = 'file.ts';

class TypeScriptSimple {

    service: ts.LanguageService = null;
    outputs: ts.Map<string> = {};
    options: ts.CompilerOptions;
    files: ts.Map<{version: number; text: string;}> = {};

    /**
     * @param {ts.CompilerOptions=} options TypeScript compile options (some options are ignored)
     */
    constructor(options: ts.CompilerOptions = {}) {
        if (options.target == null) {
            options.target = ts.ScriptTarget.ES3;
        }
        if (options.module == null) {
            options.module = ts.ModuleKind.None;
        }
        this.options = options;
    }
 
    /**
     * @param {string} code TypeScript source code to compile
     * @return {string}
     */
    compile(code: string) {
        if (!this.service) {
            this.service = this.createService();
        }

        var file = this.files[FILENAME_TS];
        file.text = code;
        file.version++;

        return this.toJavaScript(this.service);
    }

    getTypeScriptBinDir() {
        return path.dirname(require.resolve('typescript'));
    }

    createService() {
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

    getDefaultLibFilename(options: ts.CompilerOptions) {
        if (options.target === ts.ScriptTarget.ES6) {
            return 'lib.es6.d.ts';
        } else {
            return 'lib.d.ts';
        }
    }

    toJavaScript(service: ts.LanguageService) {
        var output = service.getEmitOutput(FILENAME_TS);
        if (output.emitOutputStatus === ts.EmitReturnStatus.Succeeded) {
            var filename = FILENAME_TS.replace(/ts$/, 'js');
            return output.outputFiles.filter((file) => file.name === filename)[0].text.replace(/\r\n/g, os.EOL);
        }

        var allDiagnostics = service.getCompilerOptionsDiagnostics()
            .concat(service.getSyntacticDiagnostics(FILENAME_TS))
            .concat(service.getSemanticDiagnostics(FILENAME_TS));
        throw new Error(this.formatDiagnostics(allDiagnostics));
    }

    formatDiagnostics(diagnostics: ts.Diagnostic[]) {
        return diagnostics.map((d) => {
            if (d.file) {
                return 'L' + d.file.getLineAndCharacterFromPosition(d.start).line + ': ' + d.messageText;
            } else {
                return d.messageText;
            }
        }).join(os.EOL);
    }
}

export = TypeScriptSimple;
