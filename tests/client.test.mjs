// State-machine integration with a tiny DOM adapter and REAL Python HTTP/SQLite.
// This is deliberately not a browser, layout, touch, or audio-device test.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
const source=fs.readFileSync('static/app.js','utf8');
function fakeDOM(){
 const elements=new Map(),answers=[];
 function element(id){let html='';return {id,disabled:false,textContent:'',dataset:{},value:'',children:[],className:'',classList:{values:new Set(),add(...xs){xs.forEach(x=>this.values.add(x))},contains(x){return this.values.has(x)}},setAttribute(k,v){this[k]=v},scrollIntoView(){},append(x){this.children.push(x)},focus(){},set innerHTML(s){html=s;parse(s,id)},get innerHTML(){return html}};}
 function parse(s,id){
  if(id==='main')answers.length=0;
  for(const m of s.matchAll(/<\w+\b([^>]*)>/g)){
   const attrs=m[1],id=attrs.match(/\bid="([^"]+)"/)?.[1],answer=attrs.match(/\bdata-answer="([^"]+)"/)?.[1];
   if(id){const e=element(id);e.disabled=/\bdisabled\b/.test(attrs);elements.set(id,e);}
   if(answer!==undefined){const e=element('answer');e.dataset.answer=answer;e.disabled=/\bdisabled\b/.test(attrs);answers.push(e);}
  }
 }
 for(const id of ['main','connection','voice','parent-link'])elements.set(id,element(id));
 Object.assign(elements.get('voice'),{pause(){},load(){},removeAttribute(){},play(){return Promise.resolve()}});
 return {elements,answers,querySelector(s){return elements.get(s.replace(/^#/,''))||null;},querySelectorAll(s){return s.split(',').flatMap(q=>q==='[data-answer]'?answers:elements.has(q.replace(/^#/,''))?[elements.get(q.slice(1))]:[]);},createElement:()=>element('new')};
}
async function setup(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sprout-test-'));
 const server=spawn('python3',['-u','-c',"from server import make_server; import os; s=make_server('127.0.0.1',0,os.environ['DATA_DIR']+'/progress.sqlite3'); print(s.server_port,flush=True); s.serve_forever()"],{env:{...process.env,DATA_DIR:dir}});
 t.after(async()=>{server.kill();await new Promise(r=>server.once('exit',r));fs.rmSync(dir,{recursive:true,force:true});});
 const port=await new Promise((resolve,reject)=>{server.stdout.once('data',x=>resolve(Number(x.toString().trim())));server.once('error',reject);});
 const base='http://127.0.0.1:'+port,storage=new Map();let fail=false,loseResponse=false;
 const adapter=async(url,opts)=>{
  if(fail && opts?.method==='POST')throw Error('simulated network disconnect');
  const result=await fetch(base+url,opts);
  if(loseResponse && opts?.method==='POST'){loseResponse=false;throw Error('simulated lost response after server commit');}
  return result;
 };
 function context(){
  const document=fakeDOM(),listeners={},location={hash:'#lesson',reload(){}};
  const c=vm.createContext({document,location,window:{addEventListener(k,f){listeners[k]=f}},localStorage:{get length(){return storage.size},key:i=>[...storage.keys()][i]??null,getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},fetch:adapter,AbortController,setTimeout,clearTimeout,setInterval:()=>0,crypto:crypto.webcrypto,console});
  if(fs.existsSync('static/illustrations.js'))vm.runInContext(fs.readFileSync('static/illustrations.js','utf8'),c);
  vm.runInContext(source,c);
  return {c,document,run:s=>vm.runInContext(s,c),listeners};
 }
 const env=context();await settle(env);
 return {...env,base,storage,reload:async()=>{const next=context();await settle(next);return next;},fail:v=>{fail=v},lose:()=>{loseResponse=true}};
}
async function settle(env){for(let i=0;i<200;i++){if(env.run('state!==null && !busy'))return;await new Promise(r=>setTimeout(r,10));}throw Error('app did not settle');}
async function hear(env){await env.run('play(currentTask())');env.document.elements.get('voice').onended();}
async function advance(env,answer='correct'){await hear(env);await env.run(`submit(${answer==='correct'?"currentTask().answer ?? null":JSON.stringify(answer)},currentTask())`);}

test('a whole day saves each step, fixed reward, restart and parent statuses',async t=>{
 const e=await setup(t),total=e.run('course.lessons[1].length');
 for(let i=0;i<total;i++){await advance(e);e.run('render()');}
 const state=await (await fetch(e.base+'/api/state')).json();assert.deepEqual(state.rewards,[1]);assert.equal(state.positions['1'],total);
 const re=await e.reload();assert.equal(re.run('currentDay()'),2);re.run('parentOpen=true;renderParent()');assert.match(re.document.elements.get('main').innerHTML,/完成不等于掌握/);
 assert.equal((re.document.elements.get('main').innerHTML.match(/class="word-status/g)||[]).length,35);
});
test('lost response retries same event after refresh without duplicate progress',async t=>{
 const e=await setup(t);e.lose();await advance(e);assert.equal(e.storage.size,1);const id=JSON.parse([...e.storage.values()][0]).id;
 e.fail(true);const re=await e.reload();assert.equal(re.run('pending.id'),id);assert.equal(re.run('state.positions[1]'),1);
 e.fail(false);await re.run('flush()');assert.equal(e.storage.size,0);
 const s=await(await fetch(e.base+'/api/state')).json();assert.equal(s.positions['1'],1);assert.equal(s.calendar.today_steps,1);
});
test('disconnect blocks further answers, survives refresh, reconnects',async t=>{
 const e=await setup(t);e.fail(true);await advance(e);const queued=[...e.storage.values()][0];
 assert.match(e.document.elements.get('connection').children.at(-1).children[0].textContent,/还没有同步/);
 await e.run('submit(null,currentTask())');assert.equal([...e.storage.values()][0],queued);
 const re=await e.reload();e.fail(false);await re.run('flush()');assert.equal(re.run('state.positions[1]'),1);assert.equal(e.storage.size,0);
});
test('double clicks submit once and audio failure never unlocks next',async t=>{
 const e=await setup(t);await e.run('play(currentTask())');e.document.elements.get('voice').onerror();
 assert.equal(e.run('heard'),false);assert.equal(e.document.elements.get('advance').disabled,true);await e.run('submit(null,currentTask())');assert.equal(e.run('state.positions[1]'),0);
 await hear(e);await Promise.all([e.run('submit(null,currentTask())'),e.run('submit(null,currentTask())')]);assert.equal(e.run('state.positions[1]'),1);
});
test('listen screen does not display target separately; questions need ended audio',async t=>{
 const e=await setup(t);for(let i=0;i<6;i++){await advance(e);e.run('render()');}
 assert.equal(e.run('currentTask().kind'),'listen');assert.doesNotMatch(e.document.elements.get('main').innerHTML,/class="character"/);
 assert.ok(e.document.answers.every(a=>a.disabled));await hear(e);assert.ok(e.document.answers.every(a=>!a.disabled));
});
test('storage failure prevents sending unsaved action',async t=>{
 const e=await setup(t);e.run("localStorage.setItem=()=>{throw Error('quota')} ");await advance(e);
 assert.equal(e.run('storageProblem'),true);assert.equal(e.run('state.positions[1]'),0);
 const s=await(await fetch(e.base+'/api/state')).json();assert.equal(s.positions['1'],0);
});
test('stale tab conflict cannot overwrite authoritative progress',async t=>{
 const e=await setup(t);await fetch(e.base+'/api/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'other-tab-event',day:1,step:0,answer:null})});
 await advance(e);assert.ok(e.run('pending'));assert.match(e.document.elements.get('connection').children.at(-1).children[0].textContent,/服务器进度/);
 const action=e.document.elements.get('connection').children.at(-1).children[1];await action.onclick();assert.equal(e.run('pending'),null);assert.equal(e.run('state.positions[1]'),1);
});
test('seven lessons complete without duplicate reward; reload retains 35-character stats',async t=>{
 const e=await setup(t);
 for(let day=1;day<=7;day++){
  const total=e.run(`course.lessons[${day}].length`);
  for(let i=0;i<total;i++){e.run("location.hash='#lesson';render()");await advance(e);}
 }
 const s=await(await fetch(e.base+'/api/state')).json();assert.deepEqual(s.rewards,[1,2,3,4,5,6,7]);assert.equal(Object.keys(s.stats).length,35);
 const r=await e.reload();assert.equal(r.run('state.rewards.length'),7);assert.match(r.document.elements.get('main').innerHTML,/一周的小花园/);
});
test('review: navigating to parent refreshes other-device progress',async t=>{
 const e=await setup(t);
 await fetch(e.base+'/api/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'another-device-00',day:1,step:0,answer:null})});
 e.run("location.hash='#parent';parentOpen=true");await e.listeners.hashchange();
 assert.equal(e.run('state.positions[1]'),1,'Parent navigation kept stale server statistics');
});
test('review: recovery of one event never erases another tab pending event',async t=>{
 const e=await setup(t);e.fail(true);await advance(e);
 await fetch(e.base+'/api/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'other-device-wins',day:1,step:0,answer:null})});
 const newer={id:'newer-pending-tab',day:1,step:1,answer:null};
 e.storage.set('sprout-pending-v2:'+newer.id,JSON.stringify(newer));
 e.fail(false);await e.run('flush()');
 const action=e.document.elements.get('connection').children.at(-1).children[1];await action.onclick();
 assert.equal(e.run('pending && pending.id'),newer.id,'Another tab event must remain recoverable after conflict');
 assert.equal(e.storage.get('sprout-pending-v2:'+newer.id),JSON.stringify(newer));
 await e.run('flush()');assert.equal(e.run('state.positions[1]'),2);
});
test('shared-storage second tab does not overwrite the first pending answer',async t=>{
 const a=await setup(t),b=await a.reload();a.fail(true);await advance(a);
 const original=[...a.storage.values()][0];await advance(b);
 assert.equal(a.storage.size,1);assert.equal([...a.storage.values()][0],original);
 assert.equal(b.run('pending.id'),JSON.parse(original).id);
 a.fail(false);await b.run('flush()');assert.equal(b.run('state.positions[1]'),1);
});
test('older GET cannot overwrite a newer committed POST response',async t=>{
 const e=await setup(t),original=e.c.fetch;let release,observed;
 const blocked=new Promise(r=>release=r),captured=new Promise(r=>observed=r);let capture=true;
 e.c.fetch=async(url,opts)=>{const response=await original(url,opts);if(url==='/api/state'&&capture){capture=false;observed();await blocked;}return response;};
 const refresh=e.run('refreshState()');await captured;await advance(e);assert.equal(e.run('state.positions[1]'),1);
 release();await refresh;assert.equal(e.run('state.positions[1]'),1);
});
test('offline refresh clearly labels stale progress and dates',async t=>{
 const e=await setup(t),original=e.c.fetch;e.c.fetch=async(url,opts)=>{if(url==='/api/state')throw Error('offline');return original(url,opts)};
 await e.run('refreshState()');assert.match(e.document.elements.get('connection').children.at(-1).children[0].textContent,/上次成功读取的进度与日期/);
});
test('review: first parent entry refreshes after arithmetic gate',async t=>{
 const e=await setup(t);
 await fetch(e.base+'/api/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'new-device-progress',day:1,step:0,answer:null})});
 e.run("location.hash='#parent'");await e.listeners.hashchange();
 e.document.elements.get('gate-answer').value='7';await e.document.elements.get('gate').onsubmit({preventDefault(){}});
 assert.equal(e.run('state.positions[1]'),1,'First parent entry still shows stale state');
});
test('visual revision: learning and story include art while listening stays neutral',async t=>{
 const e=await setup(t);await advance(e);e.run('render()');assert.match(e.document.elements.get('main').innerHTML,/learning-picture/);
 for(let i=1;i<6;i++){await advance(e);e.run('render()');}
 const html=e.document.elements.get('main').innerHTML;assert.match(html,/listening-mascot/);assert.doesNotMatch(html,/learning-picture|option-picture|character-art/);
});
test('visual revision: correct choice gains a check and wrong choice gets distinct gentle marker',async t=>{
 const e=await setup(t);for(let i=0;i<6;i++){await advance(e);e.run('render()');}
 const choices=[...e.document.answers],answer=e.run('currentTask().answer');await advance(e);
 const chosen=choices.find(x=>x.dataset.answer===answer);assert.ok(chosen.classList.contains('answer-correct'));assert.match(chosen.innerHTML,/答对了/);
 assert.match(e.document.elements.get('feedback').innerHTML,/feedback-success/);assert.match(e.document.elements.get('feedback').innerHTML,/feedback-symbol/);
 e.run('render()');const wrong=e.document.answers.find(x=>x.dataset.answer!==e.run('currentTask().answer')),right=e.document.answers.find(x=>x.dataset.answer===e.run('currentTask().answer'));
 await advance(e,wrong.dataset.answer);assert.ok(wrong.classList.contains('answer-try'));assert.match(wrong.innerHTML,/还不是这个/);
 assert.ok(right.classList.contains('answer-example'));assert.match(right.innerHTML,/看看这个/);
 assert.match(e.document.elements.get('feedback').innerHTML,/feedback-try/);assert.match(e.document.elements.get('feedback').innerHTML,/下一小步/);
});
test('visual revision: failed save does not show success or option verdict before acknowledgement',async t=>{
 const e=await setup(t);for(let i=0;i<6;i++){await advance(e);e.run('render()');}
 const options=[...e.document.answers];e.fail(true);await advance(e);
 assert.ok(e.run('pending'));assert.ok(options.every(b=>!b.classList.contains('answer-correct')&&!b.classList.contains('answer-try')));
 assert.equal(e.document.elements.get('feedback').innerHTML,'');
 e.fail(false);await e.run('flush()');assert.match(e.document.elements.get('feedback').innerHTML,/feedback-success/);
});
test('visual revision: all word choices get pictures and story steps get scene artwork',async t=>{
 const e=await setup(t);for(let i=0;i<11;i++){await advance(e);e.run('render()');}
 assert.equal(e.run('currentTask().kind'),'match');assert.equal((e.document.elements.get('main').innerHTML.match(/class="option-picture"/g)||[]).length,3);
 for(let i=11;i<16;i++){await advance(e);e.run('render()');}
 assert.equal(e.run('currentTask().kind'),'sentence');assert.match(e.document.elements.get('main').innerHTML,/story-picture/);
});
