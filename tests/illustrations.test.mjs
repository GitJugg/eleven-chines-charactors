import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
let art=null;
if(fs.existsSync('static/illustrations.js')){const c=vm.createContext({});vm.runInContext(fs.readFileSync('static/illustrations.js','utf8'),c);art=c.SproutArt;}
const chars=[...'日月山水火木林森大小人口手足目田土牛羊马天云雨风雪花草叶红白上下中左右'];
test('35 characters have distinct original accessible semantic SVG artwork',()=>{
 assert.ok(art,'illustration module missing');assert.equal(chars.length,35);
 const images=chars.map(c=>art.character(c));assert.equal(new Set(images).size,35);
 for(const svg of images){assert.match(svg,/<svg/);assert.match(svg,/role="img"/);assert.match(svg,/<title>/);assert.doesNotMatch(svg,/<script|<image|(?:href|src)=["']https?:|undefined|[🌼🌱♫]/);}
});
test('every lesson word and all fourteen story scenes have pictures',()=>{
 assert.ok(art,'illustration module missing');
 for(const word of ['日光','月亮','大山','河水','火苗','木头','树林','森林','大树','小草','人们','开口','小手','手足','目光','田地','泥土','小牛','山羊','小马','天空','白云','雨水','大风','雪花','小花','树叶','红花','上山','下山','中间','左手','右手'])assert.match(art.word(word,''),/<svg/);
 for(let d=1;d<=7;d++)for(let i=0;i<2;i++)assert.match(art.story(d,i),/<svg/);
});
test('listening mascot has no character-specific or target-specific art',()=>{
 assert.ok(art,'illustration module missing');const svg=art.mascot('listen');assert.match(svg,/小芽/);assert.doesNotMatch(svg,/太阳|月亮|大山|河水|火苗/);
});
test('large has a pointer and colour concepts have explicit swatches',()=>{
 assert.match(art.character('大'),/size-pointer/);
 assert.match(art.character('红'),/color-swatch/);
 assert.match(art.character('白'),/color-swatch/);
});
test('goat vocabulary uses a bearded goat rather than woolly sheep',()=>{
 assert.match(art.word('山羊','羊'),/goat-beard/);
 assert.doesNotMatch(art.character('羊'),/羊毛/);
 assert.doesNotMatch(art.character('马'),/四条腿/);
});
