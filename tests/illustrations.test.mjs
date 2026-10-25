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

// Independent semantic expectations, not just the presence of an SVG tag.
const progressive=[
 ['兔','小兔','兔','rabbit-ears'],['门','出门','门','door-frame'],['出','出来','向外','direction-out'],['来','来人','走近','direction-toward'],['在','在家','在家','home-interior'],
 ['鸟','小鸟','鸟','bird-wing'],['树','大树','树','tree-canopy'],['看','看见','看','gaze-line'],['见','见面','见面','meeting-pair'],['了','来了','到了','arrival-panels'],
 ['河','小河','河','river-bank'],['鱼','小鱼','鱼','fish-tail'],['游','游来','游','swim-trail'],['去','回去','离开','direction-away'],['里','水里','水里','water-interior'],
 ['果','水果','水果','fruit-bowl'],['吃','吃水果','吃','eating-fruit'],['你','你来','对方','point-other'],['我','我来','自己','point-self'],['也','也来','同样','same-action'],
 ['伞','雨伞','伞','umbrella-canopy'],['拿','拿伞','握','holding-handle'],['走','走来','走','walking-feet'],['回','回家','回家','direction-home'],['家','家门','家','house-roof'],
 ['晴','天晴','晴','clear-sky'],['开','开门','打开','open-door'],['朋','朋友','朋友','friend-pair'],['友','朋友','朋友','friend-pair'],['们','我们','一群','group-together'],
 ['书','看书','书','book-pages'],['找','找书','找','search-shelf'],['读','读书','读','reading-voice'],['这','这本','近处','point-near'],['本','书本','一本','book-counter'],
];
const stories=[
 [['出门','兔','门'],['门口','兔','门']], [['看见','鸟','树'],['树上','鸟']],
 [['河边','鱼','游'],['河里','游']], [['水果','我','你'],['水果','也']],
 [['雨','伞','回家'],['雨','伞','回家']], [['天晴','开门','朋友'],['天晴','朋友','门']],
 [['找','书','读'],['这本','书','朋友']],
];
test('all progressive targets have explicit context scenes, descriptive alt and semantic geometry',()=>{
 const images=[];
 for(const [char,,label,feature] of progressive){
  const svg=art.character(char);images.push(svg);
  assert.match(svg,new RegExp(`data-character="${char}"`),char+' must have its own mapping');
  assert.match(svg,new RegExp(`aria-label="[^"]*${label}`),char+' alt');
  assert.match(svg,new RegExp(`class="[^"]*${feature}`),char+' semantic feature');
  assert.doesNotMatch(svg,/sprout-mascot|一棵小树|undefined/);
 }
 assert.equal(new Set(images).size,35);
});
test('progressive vocabulary resolves from the option itself, never the target character',()=>{
 for(const [,word] of progressive){
  const svg=art.word(word,'兔');
  assert.match(svg,new RegExp(`data-word="${word}"`));
  assert.match(svg,new RegExp(`aria-label="${word}：[^\"]+`));
  assert.equal(svg,art.word(word,'鱼'),'option '+word+' must ignore target');
  assert.doesNotMatch(svg,/sprout-mascot|的配图|undefined/);
 }
 // Legacy distractors must also remain invariant when the question target changes.
 assert.equal(art.word('日光','兔'),art.word('日光','鱼'));
 assert.notEqual(art.word('我们','兔'),art.word('你来','兔'));
});
test('fourteen progressive story scenes describe the complete matching sentence context',()=>{
 const rendered=[];
 for(let day=1;day<=7;day++)for(let index=0;index<2;index++){
  const svg=art.story(day,index,'sprout-3');rendered.push(svg);
  assert.match(svg,new RegExp(`data-scene="sprout-3-${day}-${index}"`));
  for(const concept of stories[day-1][index])assert.match(svg,new RegExp(`aria-label="[^"]*${concept}`),`${day}/${index}: ${concept}`);
  assert.doesNotMatch(svg,/sprout-mascot|小芽的花园|undefined/);
 }
 assert.equal(new Set(rendered).size,14);
});
test('function-word art uses role and group context; neutral listening never exposes targets',()=>{
 for(const char of ['你','我'])assert.match(art.character(char),/换角色/);
 for(const char of ['也','了','们','这','本'])assert.match(art.character(char),/语境/);
 const listen=art.mascot('listen');
 assert.doesNotMatch(listen,/data-character|data-word|data-scene|rabbit|fish|book|兔|鱼|书/);
 assert.match(listen,/耳机/);
 assert.notEqual(listen,art.mascot('success'));
 assert.notEqual(art.mascot('try'),art.mascot('success'));
});
test('speech bubble stays with the speaker when pointing at the other person, and 来人 depicts people',()=>{
 assert.match(art.character('你'),/translate\(23 2\)/);
 assert.match(art.character('我'),/translate\(23 2\)/);
 assert.doesNotMatch(art.word('来人','来'),/class="rabbit"/);
 assert.match(art.word('来人','来'),/direction-toward/);
});

test('all 35 foundation character SVGs remain byte-for-byte unchanged',async()=>{
 const {createHash}=await import('node:crypto');
 assert.equal(createHash('sha256').update(JSON.stringify(chars.map(c=>art.character(c)))).digest('hex'),'2b01b5a7813b9e93bd8c2002a3180b2128a3bcd6694f4f418bf62cd053b0526c');
});
