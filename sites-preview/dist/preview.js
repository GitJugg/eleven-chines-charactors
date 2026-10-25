/* Sites preview adapter. All learning writes stay in this browser's IndexedDB.
 * No API server, analytics, third-party requests, or NAS synchronization. */
'use strict';
(function(root){
 const TZ='Asia/Shanghai', DEFAULTS={target_characters:3000,target_date:null,daily_new_target:5,reference_minutes:20};
 function fail(message){const e=new Error(message);e.status=400;throw e;}
 function dateKey(value){return new Intl.DateTimeFormat('sv-SE',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));}
 function createDocument(){return {schema:1,generation:crypto.randomUUID(),settings:{...DEFAULTS},events:[]};}
 function validateDocument(d,catalog){
  if(!d||d.schema!==1||typeof d.generation!=='string'||!Array.isArray(d.events)||!d.settings)fail('本机预览记录格式异常，未覆盖已有数据');
  settings({...d,settings:{...d.settings}},{});
  if(d.events.length){
   if(!catalog)fail('缺少课程，无法核对本机记录');
   const checked={schema:1,generation:d.generation,settings:{...d.settings},events:[]};
   for(const row of d.events){
    if(!row||typeof row.saved_at!=='string'||!Number.isFinite(Date.parse(row.saved_at)))fail('本机记录时间损坏');
    const count=checked.events.length;submit(checked,catalog,row.event,row.saved_at);
    const actual=checked.events.at(-1);
    if(checked.events.length!==count+1||canonical(actual)!==canonical(row))fail('本机记录摘要不一致，未覆盖已有数据');
   }
  }
  return d;
 }

 function settings(d,values){
  if(!values||typeof values!=='object'||Array.isArray(values)||Object.keys(values).some(k=>!Object.hasOwn(DEFAULTS,k)))fail('无效目标');
  const s={...d.settings,...values};
  for(const [k,max] of [['target_characters',3000],['daily_new_target',20],['reference_minutes',60]])if(!Number.isInteger(s[k])||s[k]<1||s[k]>max)fail('目标超出范围');
  if(s.target_date!==null){const v=s.target_date;if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T00:00:00Z'))||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)fail('无效日期');}
  d.settings=s;return {...s};
 }
 function course(catalog,v){const c=catalog.courses.find(c=>c.version===v);if(!c)fail('无效课程');return c;}
 function taskFor(catalog,e){const c=course(catalog,e.course_version),day=c.days.find(d=>d.id===e.lesson_id);if(!day||!Number.isInteger(e.step))fail('无效课时');const t=c.lessons[day.day]?.[e.step];if(!t)fail('无效步骤');return {c,day,t};}
 function rewarded(d,catalog,v,day){return d.events.some(x=>x.event.course_version===v&&x.day===day&&x.event.run_id==='main'&&x.kind==='reward');}
 function canonical(e){return JSON.stringify(Object.keys(e).sort().map(k=>[k,e[k]]));}
 function submit(d,catalog,e,now=new Date().toISOString()){
  const keys=['id','course_version','lesson_id','run_id','step','answer','mode','occurred_at','client_timezone','generation'];
  if(!e||Object.keys(e).sort().join()!==keys.sort().join()||typeof e.id!=='string'||e.id.length<8||e.id.length>100||typeof e.run_id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(e.run_id)||!['adult','silent'].includes(e.mode))fail('无效预览记录');
  const {day,t}=taskFor(catalog,e);
  if(t.options?!t.options.includes(e.answer):e.answer!==null)fail('无效答案');
  const previous=d.events.find(x=>x.event.id===e.id);
  if(previous){if(canonical(previous.event)!==canonical(e))fail('重复标识内容不同');return;}
  if(e.generation!==d.generation)fail('本机进度代次已改变');
  const required=e.run_id==='main'?day.day-1:day.day;
  if(required>0&&!rewarded(d,catalog,e.course_version,required))fail('请先完成相应课程');
  const count=d.events.filter(x=>x.event.course_version===e.course_version&&x.event.lesson_id===e.lesson_id&&x.event.run_id===e.run_id).length;
  if(count!==e.step)fail('本机进度已改变，请重新读取');
  let stamp=Date.parse(e.occurred_at),basis='client_reported';
  const rawDate=typeof e.occurred_at==='string'?e.occurred_at.slice(0,10):'', dateValid=/^\d{4}-\d{2}-\d{2}$/.test(rawDate)&&Number.isFinite(Date.parse(rawDate+'T00:00:00Z'))&&new Date(rawDate+'T00:00:00Z').toISOString().slice(0,10)===rawDate;
  try{new Intl.DateTimeFormat('en',{timeZone:e.client_timezone});}catch(_){stamp=NaN;}
  if(!dateValid||typeof e.occurred_at!=='string'||!/(Z|[+-]\d\d:\d\d)$/.test(e.occurred_at)||!Number.isFinite(stamp)||stamp<946684800000||stamp>Date.parse(now)+300000||dateKey(stamp)>dateKey(now)){stamp=Date.parse(now);basis='preview_device_saved';}
  d.events.push({event:structuredClone(e),day:day.day,kind:t.kind,character:t.char||null,correct:Object.hasOwn(t,'answer')?Number(e.answer===t.answer):null,date:dateKey(stamp),basis,saved_at:now});
 }
 function state(d,catalog,now=new Date().toISOString()){
  const today=dateKey(now),date=new Date(today+'T12:00:00Z'),weekday=(date.getUTCDay()+6)%7;date.setUTCDate(date.getUTCDate()-weekday);const week=date.toISOString().slice(0,10),courses={},runs=[];
  for(const c of catalog.courses){const entries=d.events.filter(x=>x.event.course_version===c.version),positions={},stats={},rewards=[];
   for(const day of c.days){positions[day.day]=entries.filter(x=>x.day===day.day&&x.event.run_id==='main').length;if(rewarded(d,catalog,c.version,day.day))rewards.push(day.day);}
   for(const x of entries){if(x.correct!==null&&x.character){const s=stats[x.character]||{attempts:0,correct:0,wrong:0,status:'learning'};s.attempts++;s.correct+=x.correct;s.wrong=s.attempts-s.correct;s.status=s.wrong?'revisit':'learning';stats[x.character]=s;}
    let run=runs.find(r=>r.course_version===c.version&&r.day===x.day&&r.run_id===x.event.run_id);
    if(!run){run={course_version:c.version,day:x.day,lesson_id:x.event.lesson_id,run_id:x.event.run_id,position:0,complete:false};runs.push(run);}run.position++;run.complete=run.position===c.lessons[x.day].length;
   }courses[c.version]={positions,stats,rewards};
  }
  const weekly=d.events.filter(x=>x.date>=week&&x.date<=today);
  return {version:'sprout-2',schema_version:3,generation:d.generation,courses,runs,...courses['sprout-2'],calendar:{timezone:TZ,date:today,week_start:week,today_steps:weekly.filter(x=>x.date===today).length,week_steps:weekly.length,week_active_days:new Set(weekly.map(x=>x.date)).size},settings:{...d.settings},mastery:{confirmed:0,status:'unassessed',note:'预览练习不代表掌握'},contacted_characters:new Set(d.events.map(x=>x.character).filter(Boolean)).size};
 }
 function calendar(d,catalog,month,filter,now=new Date().toISOString()){
  if(typeof month!=='string'||!/^\d{4}-\d{2}$/.test(month))fail('无效月份');const [y,m]=month.split('-').map(Number);if(y<1900||y>9998||m<1||m>12)fail('无效月份');if(filter)course(catalog,filter);
  const length=new Date(Date.UTC(y,m,0)).getUTCDate(),days=Array.from({length},(_,i)=>({date:month+'-'+String(i+1).padStart(2,'0'),steps:0,new_characters:[],review_characters:[],contacted_characters:[],review_questions:0,review_correct:0,other_questions:0,other_correct:0,completed:[],lessons:[],sources:[],modes:[]}));
  const add=(a,v)=>{if(v!==null&&!a.includes(v))a.push(v);};
  for(const x of d.events){if(!x.date.startsWith(month+'-')||(filter&&x.event.course_version!==filter))continue;const item=days[Number(x.date.slice(-2))-1],e=x.event,c=course(catalog,e.course_version),info={course_version:c.version,lesson_id:e.lesson_id,title:c.days[x.day-1].title,run_id:e.run_id};item.steps++;
   if(!item.lessons.some(i=>JSON.stringify(i)===JSON.stringify(info)))item.lessons.push(info);add(item.sources,x.basis);add(item.modes,e.mode);add(item.contacted_characters,x.character);
   const review=x.kind==='review'||(e.run_id!=='main'&&x.character!==null);if(review)add(item.review_characters,x.character);else if(x.kind==='learn')add(item.new_characters,x.character);
   if(x.correct!==null){const prefix=review?'review':'other';item[prefix+'_questions']++;item[prefix+'_correct']+=x.correct;}if(x.kind==='reward')item.completed.push(info);
  }
  return {month,today:dateKey(now),timezone:TZ,leading_empty:(new Date(Date.UTC(y,m-1,1)).getUTCDay()+6)%7,days,updated_at:now,time_note:'预览日期来自本机时钟，按 Asia/Shanghai 统计；不是服务器校时或真实学习评测。'};
 }
 let connection,registry;
 function database(){if(!connection)connection=new Promise((resolve,reject)=>{const req=indexedDB.open('sprout-sites-preview-v1',1);req.onupgradeneeded=()=>req.result.createObjectStore('preview');req.onerror=()=>{connection=null;reject(req.error);};req.onblocked=()=>{connection=null;reject(new Error('请关闭其他预览页后重试'));};req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();connection=null;};resolve(db);};});return connection;}
 async function transaction(action,catalog){const db=await database();return new Promise((resolve,reject)=>{let result,error;const tx=db.transaction('preview','readwrite'),store=tx.objectStore('preview'),req=store.get('document');req.onsuccess=()=>{try{const d=req.result===undefined?createDocument():validateDocument(req.result,catalog);result=action(d);store.put(d,'document');}catch(e){error=e;tx.abort();}};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(error||tx.error||new Error('本机存储失败'));tx.onabort=()=>reject(error||tx.error||new Error('本机存储失败'));});}
 async function getCatalog(){if(!registry)registry=fetch('/course.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('课程读取失败');return r.json();}).catch(e=>{registry=null;throw e;});return registry;}
 async function request(path,body){const c=await getCatalog(),url=new URL(path,'https://preview.invalid');if(url.pathname==='/api/course')return c;
  return transaction(d=>{if(url.pathname==='/api/state')return state(d,c);if(url.pathname==='/api/event'){submit(d,c,body);return state(d,c);}if(url.pathname==='/api/settings')return body?settings(d,body):{...d.settings};if(url.pathname==='/api/calendar')return calendar(d,c,url.searchParams.get('month')||dateKey(new Date()).slice(0,7),url.searchParams.get('course_version'));fail('预览不提供此接口');},c);
 }
 root.SproutPreview={createDocument,validateDocument,settings,submit,state,calendar,request};
})(globalThis);
