/// <reference path="node_modules/typescript/bin/typescript.d.ts" />
import ts = require('typescript');
declare function tss(code: string, options: ts.CompilerOptions): string;
declare module tss {
    class TypeScriptSimple {
        private doSemanticChecks;
        private service;
        private outputs;
        private options;
        private files;
        /**
         * @param {ts.CompilerOptions=} options TypeScript compile options (some options are ignored)
         * @param {boolean=} doSemanticChecks Throw if TypeScript semantic error found (default: true)
         * @constructor
         */
        constructor(options?: ts.CompilerOptions, doSemanticChecks?: boolean);
        /**
         * @param {string} code TypeScript source code to compile
         * @param {string=} fileName Only needed if you plan to use sourceMaps.
         *    Provide the complete filePath relevant to you
         * @return {string} The JavaScript with inline sourceMaps if sourceMaps were enabled
         * @throw {Error} A syntactic error or a semantic error (if doSemanticChecks is true)
         */
        compile(code: string, fileName?: string): string;
        private createService();
        private getTypeScriptBinDir();
        private getDefaultLibFileName(options);
        /**
         * converts {"version":3,"file":"file.js","sourceRoot":"","sources":["file.ts"],"names":[],
         *    "mappings":"AAAA,IAAI,CAAC,GAAG,MAAM,CAAC"}
         * to {"version":3,"sources":["foo/test.ts"],"names":[],
         *    "mappings":"AAAA,IAAI,CAAC,GAAG,MAAM,CAAC","file":"foo/test.ts","sourcesContent":["var x = 'test';"]}
         * derived from : https://github.com/thlorenz/convert-source-map
         */
        private getInlineSourceMap(mapText, fileName);
        private toJavaScript(service, fileName?);
        private formatDiagnostics(diagnostics);
    }
}
export = tss;
