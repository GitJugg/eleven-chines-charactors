const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const catalog=JSON.parse(fs.readFileSync(__dirname+'/../dist/course.json'));
const adapterPath=__dirname+'/../dist/preview.js';
const load=()=>{assert.ok(fs.existsSync(adapterPath),'preview adapter must exist');const ctx={console,URL,Date,Intl,structuredClone,crypto:require('node:crypto').webcrypto};ctx.globalThis=ctx;vm.runInNewContext(fs.readFileSync(adapterPath,'utf8'),ctx);return ctx.SproutPreview;};
const plain=x=>JSON.parse(JSON.stringify(x));const now='2026-10-25T23:00:00Z';
function event(db,v='sprout-3',day=1,step=0,run='main'){const c=catalog.courses.find(c=>c.version===v),t=c.lessons[day][step];return {id:'event-'+v+'-'+day+'-'+run+'-'+step,course_version:v,lesson_id:c.days[day-1].id,run_id:run,step,answer:t.options?t.options[0]:null,mode:'adult',occurred_at:now,client_timezone:'Asia/Shanghai',generation:db.generation};}
test('empty preview starts with blank private local records and isolated courses',()=>{const p=load(),d=p.createDocument(catalog);const s=p.state(d,catalog,now);assert.equal(s.calendar.today_steps,0);assert.equal(s.settings.target_date,null);assert.equal(s.courses['sprout-3'].positions[1],0);assert.equal(s.courses['sprout-2'].positions[1],0);assert.equal(s.mastery.confirmed,0);});
test('append is idempotent, conflicting IDs and skipped steps rejected',()=>{const p=load(),d=p.createDocument(catalog);const e=event(d);p.submit(d,catalog,e,now);p.submit(d,catalog,e,now);assert.equal(d.events.length,1);assert.throws(()=>p.submit(d,catalog,{...e,mode:'silent'},now));assert.throws(()=>p.submit(d,catalog,event(d,'sprout-3',2,1),now));assert.throws(()=>p.submit(d,catalog,{...event(d,'sprout-3',1,1),generation:'old'},now));});
test('complete lesson records its reward, repeat preserves one reward and calendar classifies review',()=>{const p=load(),d=p.createDocument(catalog),tasks=catalog.courses.find(c=>c.version==='sprout-3').lessons[1];tasks.forEach((t,i)=>p.submit(d,catalog,event(d,'sprout-3',1,i),now));assert.deepEqual(plain(p.state(d,catalog,now).courses['sprout-3'].rewards),[1]);tasks.forEach((t,i)=>p.submit(d,catalog,event(d,'sprout-3',1,i,'repeat'),now));const s=p.state(d,catalog,now);assert.deepEqual(plain(s.courses['sprout-3'].rewards),[1]);assert.equal(s.courses['sprout-2'].positions[1],0);const c=p.calendar(d,catalog,'2026-10',null,now);const today=c.days.find(x=>x.date==='2026-10-26');assert.equal(today.completed.length,2);assert.ok(today.new_characters.includes('兔'));assert.ok(today.review_characters.includes('兔'));assert.equal(p.calendar(d,catalog,'2026-10','sprout-2',now).days.reduce((n,x)=>n+x.steps,0),0);p.submit(d,catalog,event(d,'sprout-3',2),now);});
test('invalid input and storage document are not silently accepted',()=>{const p=load(),d=p.createDocument(catalog);assert.throws(()=>p.submit(d,catalog,{...event(d),answer:'bad'},now));assert.throws(()=>p.submit(d,catalog,{...event(d),mode:'fake'},now));assert.throws(()=>p.settings(d,{daily_new_target:0}));assert.throws(()=>p.settings(d,{target_date:'2026-02-30'}));assert.throws(()=>p.validateDocument({schema:9}));assert.throws(()=>p.calendar(d,catalog,'2026-99',null,now));p.settings(d,{reference_minutes:30});assert.equal(d.settings.reference_minutes,30);});
test('future/invalid device date falls back to saved date without claiming server time',()=>{const p=load(),d=p.createDocument(catalog);p.submit(d,catalog,{...event(d),occurred_at:'2099-01-01T00:00:00Z'},now);assert.equal(d.events[0].date,'2026-10-26');assert.equal(d.events[0].basis,'preview_device_saved');});
test('page integrates adapter, scopes queues, and never presents NAS backup/sync as available',()=>{const app=fs.readFileSync(__dirname+'/../dist/app.js','utf8'),html=fs.readFileSync(__dirname+'/../dist/legacy.html','utf8');assert.ok(html.indexOf('/preview.js')<html.indexOf('/app.js')&&html.includes('/preview.js'));assert.match(app,/SproutPreview.request\(path,body\)/);assert.match(app,/sprout-sites-pending-v1:/);assert.ok(!app.includes('href="/api/backup"'));assert.ok(!app.includes('同步到家庭服务器'));assert.match(html,/仅保存在当前浏览器/);assert.match(html,/不与极空间同步/);});
test('tampered saved event summaries fail closed rather than award flowers or move dates',()=>{const p=load(),d=p.createDocument();p.submit(d,catalog,event(d),now);d.events[0].kind='reward';assert.throws(()=>p.validateDocument(d,catalog));});
test('calendar-invalid client timestamp falls back rather than silently rolling into March',()=>{const p=load(),d=p.createDocument();p.submit(d,catalog,{...event(d),occurred_at:'2026-02-30T00:00:00Z'},now);assert.equal(d.events[0].date,'2026-10-26');assert.equal(d.events[0].basis,'preview_device_saved');});
test('device audio events save without falsely confirming mastery',()=>{const p=load(),d=p.createDocument();p.submit(d,catalog,{...event(d),mode:'audio'},now);assert.equal(p.state(d,catalog,now).mastery.confirmed,0);assert.deepEqual(plain(p.calendar(d,catalog,'2026-10',null,now).days.find(x=>x.steps).modes),['audio']);});
test('new runs skip intro without synthetic records and retain raw task indices through reward and repeat',()=>{
 const p=load(),d=p.createDocument(),c=catalog.courses.find(c=>c.version==='sprout-3'),tasks=c.lessons[1];
 assert.throws(()=>p.submit(d,catalog,event(d,'sprout-3',1,2),now),'cannot skip first real card');
 for(const run of ['main','repeat']){
  tasks.forEach((t,i)=>{if(t.kind!=='warmup')p.submit(d,catalog,event(d,'sprout-3',1,i,run),now);});
  const s=p.state(d,catalog,now),r=s.runs.find(r=>r.run_id===run);
  assert.equal(r.complete,true);assert.equal(r.position,tasks.length);
  p.validateDocument(d,catalog);
 }
 assert.equal(d.events.length,(tasks.length-1)*2);
 assert.equal(d.events[0].event.step,1);assert.equal(d.events[0].character,'兔');
 assert.ok(d.events.every(x=>x.kind!=='warmup'));
 assert.equal(p.state(d,catalog,now).calendar.today_steps,d.events.length);
 assert.deepEqual(plain(p.state(d,catalog,now).courses['sprout-3'].rewards),[1]);
});
test('historical intro and retried queued intro retain identity and resume first real card',()=>{
 const p=load(),d=p.createDocument(),intro=event(d);
 p.submit(d,catalog,intro,now);const saved=JSON.stringify(d.events);
 p.validateDocument(d,catalog);p.submit(d,catalog,intro,now);
 assert.equal(JSON.stringify(d.events),saved);
 assert.equal(p.state(d,catalog,now).courses['sprout-3'].positions[1],1);
 p.submit(d,catalog,event(d,'sprout-3',1,1),now);p.validateDocument(d,catalog);
 assert.equal(d.events[1].kind,'learn');assert.equal(d.events[1].character,'兔');
 assert.equal(p.state(d,catalog,now).courses['sprout-3'].positions[1],2);
});
