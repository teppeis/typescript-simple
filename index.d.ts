/// <reference path="typings/node/node.d.ts" />
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
         */
        constructor(options?: ts.CompilerOptions, doSemanticChecks?: boolean);
        /**
         * @param {string} code TypeScript source code to compile
         * @param {string} only needed if you plan to use sourceMaps. Provide the complete filePath relevant to you
         * @return {string} The JavaScript with inline sourceMaps if sourceMaps were enabled
         */
        compile(code: string, filename?: string): string;
        private createService();
        private getTypeScriptBinDir();
        private getDefaultLibFilename(options);
        /**
         * converts {"version":3,"file":"file.js","sourceRoot":"","sources":["file.ts"],"names":[],"mappings":"AAAA,IAAI,CAAC,GAAG,MAAM,CAAC"}
         * to {"version":3,"sources":["foo/test.ts"],"names":[],"mappings":"AAAA,IAAI,CAAC,GAAG,MAAM,CAAC","file":"foo/test.ts","sourcesContent":["var x = 'test';"]}
         * derived from : https://github.com/thlorenz/convert-source-map
         */
        private getInlineSourceMap(mapText, filename);
        private toJavaScript(service, filename?);
        private formatDiagnostics(diagnostics);
    }
}
export = tss;
