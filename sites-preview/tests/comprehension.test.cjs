// Real catalog, art, speech and UI. MP3 playback callbacks are controlled here;
// this verifies context and gating, not acoustic or browser layout quality.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto').webcrypto,fakeDOM=require('./dom-helper.cjs');
const source=f=>fs.readFileSync(__dirname+'/../dist/'+f,'utf8'),catalog=JSON.parse(source('course.json'));
function open(day){
 const document=fakeDOM(),spoken=[],storage=new Map(),ctx={console,URL,Date,Intl,structuredClone,crypto,document,location:{hash:'#lesson/sprout-3/'+day+'/main'},window:{addEventListener(){}},localStorage:{get length(){return storage.size},key:i=>[...storage.keys()][i]??null,getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},...require('./audio-helper.cjs')(spoken)};
 ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(source('preview.js'),ctx);const p=ctx.SproutPreview,d=p.createDocument(),course=catalog.courses.find(c=>c.version==='sprout-3'),tasks=course.lessons[day],step=tasks.findIndex(t=>t.kind==='comprehension');
 for(let i=0;i<step;i++)if(tasks[i].kind!=='warmup')p.submit(d,catalog,{id:'prior-'+day+'-'+i,course_version:course.version,lesson_id:course.days[day-1].id,run_id:'main',step:i,answer:tasks[i].answer??null,mode:'adult',occurred_at:new Date().toISOString(),client_timezone:'Asia/Shanghai',generation:d.generation});
 ctx.SproutPreview={request:async(path,body)=>{if(path==='/api/course')return catalog;if(path==='/api/state')return p.state(d,catalog);if(path==='/api/event'){p.submit(d,catalog,body);return p.state(d,catalog);}throw Error(path)}};
 for(const file of ['illustrations.js','speech.js','app.js'])vm.runInContext(source(file),ctx);
 return {ctx,document,spoken,d,task:tasks[step],lesson:course.days[day-1],run:s=>vm.runInContext(s,ctx)};
}
async function ready(e){for(let i=0;i<50;i++){if(e.run('state!==null&&!busy'))return;await new Promise(r=>setTimeout(r,2));}throw Error('boot failed');}
test('all story questions show their story and explicit meaningful option illustrations',async()=>{
 for(let day=1;day<=7;day++){const e=open(day);await ready(e);const html=e.document.elements.get('main').innerHTML;
 assert.match(html,/class="comprehension-context"/,'story context is on question page');
 assert.ok(html.includes(e.lesson.sentences[0]));assert.match(html,/data-scene="sprout-3-/);
 for(const option of e.task.options){assert.ok(html.includes('data-comprehension-option="'+option+'"'),option+' has explicit art');}
 assert.equal(e.run("SproutArt.comprehensionOption('尚未设计的选项')"),null,'unknown option must not become a tree');
 }
});
test('comprehension playback includes full story, question and every option before unlocking',async()=>{
 for(let day=1;day<=7;day++){const e=open(day);await ready(e);const before=e.d.events.length;e.run('play(currentTask())');const u=e.spoken.at(-1);
 assert.ok(u.text.includes(e.lesson.sentences[0]));assert.ok(u.text.includes(e.task.text));for(const o of e.task.options)assert.ok(u.text.includes(o));
 assert.ok(u.text.indexOf(e.lesson.sentences[0])<u.text.indexOf(e.task.text));assert.ok(!u.text.includes('答案是'));
 assert.equal(e.d.events.length,before);assert.ok(e.document.answers.every(b=>b.disabled));u.onstart();u.onend();assert.ok(e.document.answers.every(b=>!b.disabled));
 }
});
test('wrong comprehension feedback explains story evidence without calling a place a friend',async()=>{
 const e=open(1);await ready(e);e.run("acknowledgeMode('adult')");await e.run("submit('山上',currentTask())");const html=e.document.elements.get('feedback').innerHTML;
 assert.ok(html.includes(e.lesson.sentences[0]));assert.ok(html.includes('门口'));assert.ok(!html.includes('这个朋友'));assert.ok(e.document.elements.get('next'));
});
test('replay failures and stale callbacks never submit or unlock a new story question',async()=>{
 const e=open(1);await ready(e);const before=e.d.events.length;e.run('play(currentTask())');const first=e.spoken.at(-1);first.onstart();e.run('play(currentTask())');const latest=e.spoken.at(-1);first.onend();assert.equal(e.run('heard'),false);latest.onerror({error:'not-allowed'});assert.equal(e.run('heard'),false);assert.equal(e.d.events.length,before);
 e.run("location.hash='#overview/sprout-3/2';render()");latest.onstart();latest.onend();assert.equal(e.run('heard'),false);assert.equal(e.d.events.length,before);
});
