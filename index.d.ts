/// <reference path="typings/node/node.d.ts" />
/// <reference path="node_modules/typescript/bin/typescript.d.ts" />
import ts = require('typescript');
declare function tss(code: string, options: ts.CompilerOptions): string;
declare module tss {
    class TypeScriptSimple {
        private service;
        private outputs;
        private options;
        private files;
        /**
        * @param {ts.CompilerOptions=} options TypeScript compile options (some options are ignored)
        */
        constructor(options?: ts.CompilerOptions);
        /**
        * @param {string} code TypeScript source code to compile
        * @return {string}
        */
        compile(code: string): string;
        private createService();
        private getTypeScriptBinDir();
        private getDefaultLibFilename(options);
        private toJavaScript(service);
        private formatDiagnostics(diagnostics);
    }
}
export = tss;
