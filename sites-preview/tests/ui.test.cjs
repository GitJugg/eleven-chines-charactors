// Real preview reducer + existing UI state machine, tiny DOM. Not browser/layout QA.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto').webcrypto,fakeDOM=require('./dom-helper.cjs');
const catalog=JSON.parse(fs.readFileSync(__dirname+'/../dist/course.json'));
function setup(withSpeech=false){const storage=new Map(),ctx={console,URL,Date,Intl,structuredClone,crypto};ctx.globalThis=ctx;vm.runInNewContext(fs.readFileSync(__dirname+'/../dist/preview.js','utf8'),ctx);const p=ctx.SproutPreview,d=p.createDocument();let fail=false;
 const request=async(path,body)=>{const u=new URL(path,'https://preview.invalid');if(body&&fail)throw Error('storage unavailable');if(u.pathname==='/api/course')return catalog;if(u.pathname==='/api/state')return p.state(d,catalog);if(u.pathname==='/api/event'){p.submit(d,catalog,body);return p.state(d,catalog);}if(u.pathname==='/api/settings')return p.settings(d,body||{});if(u.pathname==='/api/calendar')return p.calendar(d,catalog,u.searchParams.get('month'),u.searchParams.get('course_version'));throw Error('unexpected');};
 function open(hash='#home'){const spoken=[];const document=fakeDOM(),location={hash,reload(){}},c=vm.createContext({document,location,window:{addEventListener(){}},localStorage:{get length(){return storage.size},key:i=>[...storage.keys()][i]??null,getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},crypto,console,SproutPreview:{request},...(withSpeech?require('./audio-helper.cjs')(spoken):{})});vm.runInContext(fs.readFileSync(__dirname+'/../dist/illustrations.js','utf8'),c);if(withSpeech)vm.runInContext(fs.readFileSync(__dirname+'/../dist/speech.js','utf8'),c);vm.runInContext(fs.readFileSync(__dirname+'/../dist/app.js','utf8'),c);return {c,document,spoken,run:s=>vm.runInContext(s,c)};}
 return {open,d,p,storage,fail:v=>fail=v};}
async function ready(e){for(let i=0;i<50;i++){if(e.run('state!==null&&!busy'))return;await new Promise(r=>setTimeout(r,2));}throw Error('boot failed');}
async function advance(e,wrong=false){e.run("acknowledgeMode('adult')");await e.run(`submit(${wrong?"currentTask().options.find(x=>x!==currentTask().answer)":"currentTask().answer??null"},currentTask())`);}
test('preview UI completes progressive lesson, reload advances, calendar shows completion, foundation stays separate',async()=>{const s=setup(),e=s.open('#lesson/sprout-3/1/main');await ready(e);const total=e.run('visibleTasks(1).length');for(let i=0;i<total;i++){await advance(e);if(i<total-1)e.run('render()');}assert.equal(e.run("state.courses['sprout-3'].rewards.length"),1);assert.equal(s.storage.size,0);const re=s.open();await ready(re);assert.equal(re.run('currentDay()'),2);re.run("location.hash='#parent/sprout-3';parentOpen=true;renderParent()");await re.run('loadCalendar(state.calendar.date.slice(0,7))');assert.equal(re.run('calendarData.days.find(x=>x.date===state.calendar.date).completed.length'),1);re.run("chooseCourse('sprout-2');location.hash='#home/sprout-2';render()");assert.equal(re.run('currentDay()'),1);assert.equal(re.run('progressState().positions[1]'),0);assert.ok(!re.document.elements.get('main').innerHTML.includes('/api/backup'));});
test('failed local save retains pending event and retry saves once',async()=>{const s=setup(),e=s.open('#lesson/sprout-3/1/main');await ready(e);s.fail(true);await advance(e);assert.equal(s.storage.size,1);assert.equal(s.d.events.length,0);assert.equal(e.run('Boolean(pending)'),true);s.fail(false);await e.run('flush()');assert.equal(s.storage.size,0);assert.equal(s.d.events.length,1);});
test('wrong answer feedback waits for next and adult answer prompt hides before selecting',async()=>{const s=setup(),e=s.open('#lesson/sprout-3/1/main');await ready(e);while(!e.run('Boolean(currentTask().options)')){await advance(e);e.run('render()');}e.run("acknowledgeMode('adult')");assert.equal(e.document.elements.get('adult-prompt').hidden,true);await advance(e,true);assert.match(e.document.elements.get('feedback').innerHTML,/这次还没找对/);assert.ok(e.document.elements.get('next'));});

test('audio UI requires successful complete playback, saves audio mode, and ignores canceled playback',async()=>{const s=setup(true),e=s.open('#lesson/sprout-3/1/main');await ready(e);assert.ok(e.document.elements.get('play'));e.run('play(currentTask())');assert.equal(e.run('heard'),false);assert.equal(e.document.elements.get('advance').disabled,true);e.spoken[0].onstart();assert.equal(e.run('heard'),false);e.spoken[0].onend();assert.equal(e.run('heard'),true);assert.equal(e.document.elements.get('advance').disabled,false);await e.run('submit(null,currentTask())');assert.equal(s.d.events[0].event.mode,'audio');e.run('render()');const u=e.spoken.at(-1);e.run('stopAudio()');u.onstart();u.onend();assert.equal(e.run('heard'),false);});
test('failed speech keeps next disabled and can be replayed successfully',async()=>{const s=setup(true),e=s.open('#lesson/sprout-3/1/main');await ready(e);e.run('play(currentTask())');e.spoken[0].onerror({error:'not-allowed'});assert.equal(e.run('heard'),false);assert.equal(e.document.elements.get('advance').disabled,true);e.run('play(currentTask())');e.spoken[1].onstart();e.spoken[1].onend();assert.equal(e.run('heard'),true);assert.equal(e.run('learningMode'),'audio');});
test('navigating to another lesson overview cancels active audio and ignores its late completion',async()=>{const s=setup(true),e=s.open('#lesson/sprout-3/1/main');await ready(e);e.run('play(currentTask())');const old=e.spoken[0];old.onstart();e.run("location.hash='#overview/sprout-3/5';render()");old.onend();assert.equal(e.run('heard'),false);assert.equal(e.run('learningMode'),null);assert.equal(s.d.events.length,0);e.run("location.hash='#lesson/sprout-3/5/main';render()");const fresh=e.spoken.at(-1);assert.notEqual(fresh,old);assert.equal(e.run('heard'),false);old.onend();assert.equal(e.run('heard'),false);fresh.onstart();fresh.onend();assert.equal(e.run('heard'),true);assert.equal(e.run('currentDay()'),5);});
test('fresh first lesson opens real learning directly with visible counters and no implicit record',async()=>{
 for(const v of ['sprout-2','sprout-3']){
  const s=setup(),e=s.open('#lesson/'+v+'/1/main');await ready(e);
  assert.equal(e.run('currentTask().kind'),'learn');assert.equal(e.run('currentPosition()'),1);
  assert.equal(s.d.events.length,0);
  const total=catalog.courses.find(c=>c.version===v).lessons[1].length-1;
  assert.match(e.document.elements.get('main').innerHTML,new RegExp('第 1 小步 / '+total));
  assert.ok(!e.document.elements.get('main').innerHTML.includes('出发前，听一听'));
  await advance(e);assert.equal(s.d.events[0].event.step,1);
  const re=s.open('#lesson/'+v+'/1/main');await ready(re);
  assert.equal(re.run('currentPosition()'),2);
  assert.equal(re.run('currentTask().kind'),catalog.courses.find(c=>c.version===v).lessons[1][2].kind);
  re.run("location.hash='#overview/"+v+"/1';render()");
  assert.match(re.document.elements.get('main').innerHTML,new RegExp('共 '+total+' 小步'));
  assert.ok(!re.document.elements.get('main').innerHTML.includes('听一听，准备出发'));
 }
});
test('old queued intro flushes once on boot and old partial/repeat runs do not skip real work',async()=>{
 for(const v of ['sprout-2','sprout-3']){
  const s=setup(),c=catalog.courses.find(c=>c.version===v);
  const make=(step,run='main')=>({id:'old-event-'+v+'-'+run+'-'+step,course_version:v,lesson_id:c.days[0].id,run_id:run,step,answer:c.lessons[1][step].answer??null,mode:'adult',occurred_at:new Date().toISOString(),client_timezone:'Asia/Shanghai',generation:s.d.generation});
  const intro=make(0),key='sprout-sites-pending-v1:'+intro.id;
  s.storage.set(key,JSON.stringify(intro));
  const e=s.open('#lesson/'+v+'/1/main');await ready(e);
  assert.equal(s.storage.size,0);assert.equal(s.d.events.length,1);
  assert.deepEqual(JSON.parse(JSON.stringify(s.d.events[0].event)),intro);
  assert.equal(e.run('currentPosition()'),1);assert.equal(e.run('currentTask().kind'),'learn');
  s.storage.set(key,JSON.stringify(intro));const re=s.open('#lesson/'+v+'/1/main');await ready(re);
  assert.equal(s.storage.size,0);assert.equal(s.d.events.length,1,'retry does not duplicate legacy event');
  await advance(re);const partial=s.open('#lesson/'+v+'/1/main');await ready(partial);
  assert.equal(partial.run('currentPosition()'),2);
  for(let i=2;i<c.lessons[1].length;i++)s.p.submit(s.d,catalog,make(i));
  s.p.submit(s.d,catalog,make(0,'old-repeat'));
  const repeat=s.open('#lesson/'+v+'/1/old-repeat');await ready(repeat);
  assert.equal(repeat.run('currentPosition()'),1);
  assert.match(repeat.document.elements.get('main').innerHTML,/第 1 小步/);
  await advance(repeat);const resumed=s.open('#lesson/'+v+'/1/old-repeat');await ready(resumed);
  assert.equal(resumed.run('currentPosition()'),2);
  s.p.validateDocument(s.d,catalog);
 }
});
test('new repeat starts first real card without creating an intro record',async()=>{
 const s=setup(),c=catalog.courses.find(c=>c.version==='sprout-3');
 const e=s.open('#lesson/sprout-3/1/main');await ready(e);
 for(let i=1;i<c.lessons[1].length;i++){await advance(e);e.run('render()');}
 const before=s.d.events.length;e.run("startPractice(1);render()");
 assert.equal(e.run('currentPosition()'),1);assert.equal(e.run('currentTask().kind'),'learn');
 assert.equal(s.d.events.length,before);assert.ok(!s.d.events.some(x=>x.kind==='warmup'));
 await advance(e);assert.equal(s.d.events.at(-1).event.step,1);
 assert.equal(e.run("progressState().rewards.length"),1);
});
