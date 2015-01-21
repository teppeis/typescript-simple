var tss = require('./');
var TypeScriptSimple = tss.TypeScriptSimple;

var src1 = "var x: number = 1;";
var src2 = "var y: string = 'a';";
var start = new Date().getTime();
for (var i = 0; i < 5; i++) {
    tss = new TypeScriptSimple();
    tss.compile(src1);
    tss = new TypeScriptSimple();
    tss.compile(src2);
}
console.log('each time compile', (new Date() - start) / 1000);

start = new Date().getTime();
new TypeScriptSimple();
for (var i = 0; i < 5; i++) {
    tss.compile(src1);
    tss.compile(src2);
}
console.log('incremental compile', (new Date() - start) / 1000);
