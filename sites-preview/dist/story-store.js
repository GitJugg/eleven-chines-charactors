'use strict';
(function(root){
 const DB='sprout-sites-preview-v1', BACKUP='backup-before-story-v1';
 const timezone=()=>Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
 function dateKey(value=new Date(),zone=timezone()){return new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));}
 function addDays(date,n){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
 function fail(message){throw new Error(message);}
 function migrate(d){
  if(!d||d.schema!==1||!Array.isArray(d.events)||!d.settings)fail('原记录格式异常，未覆盖数据');
  if(!Object.hasOwn(d,'storyV1'))d.storyV1={version:1,events:[],known:{},plans:[],draft:null,revision:0,receipts:{}};
  const s=d.storyV1,object=x=>x&&typeof x==='object'&&!Array.isArray(x);
  if(!object(s)||s.version!==1||!Array.isArray(s.events)||!Array.isArray(s.plans)||!object(s.known)||Object.values(s.known).some(v=>typeof v!=='boolean'))fail('故事记录格式异常，未覆盖数据');
  if(s.draft!==null&&(!object(s.draft)||typeof s.draft.id!=='string'||!s.draft.id||!['story','meaning','recognize','summary'].includes(s.draft.phase)||!Array.isArray(s.draft.selected)||!Array.isArray(s.draft.heard)||!Array.isArray(s.draft.checks)||!object(s.draft.helped)||!Number.isInteger(s.draft.sentenceIndex)))fail('故事进度格式异常，未覆盖数据');
  if(s.revision!==undefined&&(!Number.isSafeInteger(s.revision)||s.revision<0)||s.receipts!==undefined&&!object(s.receipts))fail('故事版本格式异常，未覆盖数据');
  if(s.events.some(e=>!object(e)||typeof e.id!=='string'||typeof e.type!=='string'||!Number.isFinite(Date.parse(e.occurredAt))||typeof e.date!=='string'||typeof e.timezone!=='string')||s.plans.some(p=>!object(p)||typeof p.id!=='string'||!['planned','completed','skipped'].includes(p.status)||!Array.isArray(p.characters)||!['A','B'].includes(p.round)))fail('故事历史格式异常，未覆盖数据');
  s.revision??=0;s.receipts??={};return s;
 }
 function apply(d,a,c,now=new Date().toISOString(),zone=timezone()){
  if(!a||typeof a.eventId!=='string'||!a.eventId||a.eventId.length>150)fail('缺少记录标识');
  const next=structuredClone(d),s=migrate(next),fingerprint=JSON.stringify(Object.keys(a).sort().map(k=>[k,a[k]]));
  if(Object.hasOwn(s.receipts,a.eventId)){if(s.receipts[a.eventId]!==fingerprint)fail('重复标识内容不同');return d.storyV1;}
  if(a.expectedRevision!==undefined&&a.expectedRevision!==s.revision)fail('另一页面已更新记录，请重新读取后继续');
  applyAction(next,a,c,now,zone);s.receipts[a.eventId]=fingerprint;s.revision++;
  // Commit only once every validation has succeeded. No partial reducer writes.
  d.storyV1=s;return s;
 }
 function applyAction(d,a,c,now,zone){
  const s=migrate(d),p=c.packages.find(p=>p.id===a.packageId),stamp={occurredAt:now,date:dateKey(now,zone),timezone:zone};
  const emit=(type,data={})=>{if(!a.eventId)fail('缺少记录标识');const prior=s.events.find(e=>e.id===a.eventId);if(prior)return prior;const e={id:a.eventId,type,...data,...stamp};s.events.push(e);return e;};
  if(a.eventId&&s.events.some(e=>e.id===a.eventId))return s;
  if(a.type==='known'){if(!c.packages.some(p=>p.characters.includes(a.char))&&!c.foundation.includes(a.char))fail('无效字');if(typeof a.value!=='boolean')fail('无效家长报告');s.known[a.char]=a.value;emit('parent_known',{char:a.char,value:a.value,source:'parent_report'});}
  else if(a.type==='start'){
   if(typeof a.sessionId!=='string'||!a.sessionId||a.sessionId.length>150)fail('无效活动标识');
   if(!p||!Array.isArray(a.selected)||new Set(a.selected).size!==a.selected.length||a.selected.some(x=>!p.characters.includes(x)))fail('无效故事或候选字');
   s.draft={id:a.sessionId,packageId:p.id,selected:a.selected,phase:'story',sentenceIndex:0,heard:[],checks:[],helped:{},meaning:null,reviewPlan:null};
  }else if(a.type==='review'){
   if(typeof a.sessionId!=='string'||!a.sessionId||a.sessionId.length>150)fail('无效活动标识');
   const plan=s.plans.find(x=>x.id===a.planId&&x.status==='planned');if(!plan)fail('回访计划已改变');
   s.draft={id:a.sessionId,packageId:plan.packageId,selected:plan.characters,phase:'recognize',sentenceIndex:0,heard:[],checks:[],helped:{},meaning:null,reviewPlan:plan.id};
  }else if(a.type==='plan'){
   const plan=s.plans.find(x=>x.id===a.planId);if(!plan)fail('无效回访');
   if(a.status==='skipped'){plan.status='skipped';plan.changedAt=now;}
   else if(a.dueDate&&/^\d{4}-\d{2}-\d{2}$/.test(a.dueDate)&&addDays(a.dueDate,0)===a.dueDate){plan.dueDate=a.dueDate;plan.changedAt=now;}else fail('无效计划日期');
  }else if(a.type==='reread'){
   const group=c.rereads.find(x=>x.id===a.groupId);if(!group||!group.sentences.includes(a.text))fail('无效复读句');emit('reread_listened',{groupId:a.groupId,text:a.text});
  }else{
   const draft=s.draft;if(!draft||draft.id!==a.sessionId)fail('活动已改变，请重新打开');
   const pack=c.packages.find(p=>p.id===draft.packageId);
   if(a.type==='backToStory'){
    if(draft.phase!=='meaning')fail('只能从理解页回到故事');draft.phase='story';
   }else if(a.type==='heard'){
    if(draft.phase!=='story'||!pack.sentences.includes(a.text))fail('无效听读');
    if(!draft.heard.includes(a.text))draft.heard.push(a.text);emit('listened',{sessionId:draft.id,packageId:pack.id,text:a.text});
   }else if(a.type==='sentence'){
    if(draft.phase!=='story'||!Number.isInteger(a.index)||a.index<0||a.index>=pack.sentences.length)fail('无效句子');draft.sentenceIndex=a.index;
   }else if(a.type==='phase'){
    if(a.phase==='meaning'&&draft.phase==='story'&&draft.heard.length===pack.sentences.length)draft.phase='meaning';
    else if(a.phase==='recognize'&&draft.phase==='meaning'&&draft.meaning)draft.phase='recognize';
    else fail('请先完成本步，或选择只记听过');
   }else if(a.type==='meaning'){
    if(draft.phase!=='meaning')fail('无效理解活动');draft.meaning={answer:a.answer,correct:Boolean(a.correct)};emit('meaning',{sessionId:draft.id,packageId:pack.id,...draft.meaning});
   }else if(a.type==='help'){
    if(draft.phase!=='recognize'||!draft.selected.includes(a.char)||draft.checks.some(x=>x.char===a.char))fail('无效帮助');
    const answer=pack.recognition.find(r=>r.char===a.char)?.sentence;
    if(a.answerAudio&&!answer)fail('缺少目标字答案');
    const affected=a.answerAudio?draft.selected.filter(ch=>!draft.checks.some(x=>x.char===ch)&&answer.includes(ch)):[a.char];
    for(const ch of affected)draft.helped[ch]=true;
    emit('help',{sessionId:draft.id,packageId:pack.id,char:a.char,affected,answerAudio:Boolean(a.answerAudio)});
   }else if(a.type==='observe'){
    if(draft.phase!=='recognize'||!draft.selected.includes(a.char)||draft.checks.some(x=>x.char===a.char)||!['independent','prompted','uncertain'].includes(a.status))fail('无效观察');
    if(a.status==='independent'&&draft.helped[a.char])fail('已经听过答案或得到帮助，不能记独立读出');
    const check={char:a.char,status:a.status,helped:Boolean(draft.helped[a.char])||a.status==='prompted'};draft.checks.push(check);emit('observation',{sessionId:draft.id,packageId:pack.id,...check,source:'parent_observation',review:Boolean(draft.reviewPlan)});
   }else if(a.type==='finish'){
    if(draft.phase==='summary')fail('本轮已经结束');
    if(!draft.heard.length&&!draft.checks.length)fail('还没有听读或观察，不生成学习记录');
    if(!a.listenOnly&&draft.checks.length!==draft.selected.length)fail('请完成观察或只记听过');
    emit('session_end',{sessionId:draft.id,packageId:pack.id,selected:draft.selected,checks:draft.checks,listenOnly:Boolean(a.listenOnly)||!draft.checks.length});
    const chars=draft.checks.map(x=>x.char);
    if(draft.reviewPlan){const old=s.plans.find(x=>x.id===draft.reviewPlan);old.status='completed';old.actualDate=stamp.date;if(old.round==='A'&&chars.length)s.plans.push({id:draft.id+'-B',packageId:pack.id,characters:chars,round:'B',dueDate:addDays(stamp.date,4),basisDate:stamp.date,status:'planned'});}
    else if(chars.length)s.plans.push({id:draft.id+'-A',packageId:pack.id,characters:chars,round:'A',dueDate:addDays(stamp.date,2),basisDate:stamp.date,status:'planned'});
    draft.phase='summary';draft.finishedDate=stamp.date;
   }else fail('未知动作');
  }
  return s;
 }
 let dbPromise;
 function database(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('preview'))r.result.createObjectStore('preview');};r.onerror=()=>{dbPromise=null;reject(r.error);};r.onblocked=()=>{dbPromise=null;reject(Error('请关闭其他旧页面后重试，记录不会清空'));};r.onsuccess=()=>{r.result.onversionchange=()=>{r.result.close();dbPromise=null;};resolve(r.result);};});return dbPromise;}
 async function transaction(a,c,legacy){const db=await database();return new Promise((resolve,reject)=>{
  let result,error;const tx=db.transaction('preview','readwrite'),store=tx.objectStore('preview'),r=store.get('document');
  r.onsuccess=()=>{try{const d=r.result===undefined?root.SproutPreview.createDocument():root.SproutPreview.validateDocument(r.result,legacy);
   if(!d.storyV1&&r.result!==undefined)store.put(structuredClone(d),BACKUP);
   migrate(d);if(a)apply(d,a,c);store.put(d,'document');result=structuredClone(d);
  }catch(e){error=e;tx.abort();}};
  tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(error||tx.error||Error('保存失败，原记录未覆盖'));
 });}
 root.SproutStoryStore={migrate,apply,dateKey,addDays,transaction,timezone,BACKUP};
})(globalThis);
