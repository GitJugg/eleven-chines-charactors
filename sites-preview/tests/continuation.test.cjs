const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const catalog=JSON.parse(fs.readFileSync(__dirname+'/../dist/course.json')),progressive=catalog.courses.find(c=>c.version==='sprout-3');
const plain=x=>JSON.parse(JSON.stringify(x)),hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function adapter(){const c={URL,Date,Intl,structuredClone,crypto:crypto.webcrypto};c.globalThis=c;vm.runInNewContext(fs.readFileSync(__dirname+'/../dist/preview.js','utf8'),c);return c.SproutPreview;}
const now='2026-01-15T06:00:00Z';
function event(d,c,day,step,run='main'){const course=c.courses.find(c=>c.version==='sprout-3'),t=course.lessons[day][step];return {id:`continuation-${day}-${run}-${step}`,course_version:'sprout-3',lesson_id:course.days[day-1].id,run_id:run,step,answer:t.answer??null,mode:'audio',occurred_at:now,client_timezone:'Asia/Shanghai',generation:d.generation};}
test('complete continuation has fifteen progressive lessons, five new targets each and transparent future drafts',()=>{
 assert.equal(progressive.days.length,15);assert.equal(catalog.published_characters,110);
 const targets=catalog.courses.flatMap(c=>c.days.flatMap(d=>d.words.map(w=>w.char)));assert.equal(targets.length,110);assert.equal(new Set(targets).size,110);
 const known=new Set(catalog.courses[0].days.flatMap(d=>d.words.map(w=>w.char)));
 for(const d of progressive.days){d.words.forEach(w=>known.add(w.char));if(d.day<8)continue;
  assert.equal(d.words.length,5);assert.equal(d.id,`journey-${String(d.day).padStart(2,'0')}`);
  for(const w of d.words){assert.ok(w.word.includes(w.char));assert.ok(w.reading);assert.ok(d.story.includes(w.char));}
  for(const ch of d.independent_text.match(/[\u4e00-\u9fff]/g)||[])assert.ok(known.has(ch),`untaught ${ch} in practice ${d.day}`);
  for(const match of progressive.lessons[d.day].filter(t=>t.kind==='match')){assert.deepEqual(match.options.filter(o=>o.includes(match.char)),[match.answer]);}
  const q=progressive.lessons[d.day].find(t=>t.kind==='comprehension');assert.equal(new Set(q.options).size,3);assert.equal(q.options.filter(x=>x===q.answer).length,1);assert.ok(d.story.includes(d.answer_evidence));assert.ok(d.answer_evidence.includes(q.answer)||(q.answer==='爸爸妈妈和爷爷奶奶'&&d.answer_evidence.includes('爸爸和妈妈')&&d.answer_evidence.includes('爷爷和奶奶'))||(q.answer==='穿衣'&&d.answer_evidence.includes('穿好衣服')));
 }
 assert.deepEqual(catalog.planned_lessons.map(x=>x.day),Array.from({length:13},(_,i)=>i+16));
 assert.ok(catalog.planned_lessons.every(x=>x.status==='planned'&&!progressive.lessons[x.day]));
 assert.deepEqual(catalog.stages.map(x=>x.new_lessons),[53,100,140,140,160]);
});
test('foundation and original first seven lesson data remain immutable',()=>{
 assert.equal(hash(catalog.courses[0]),'c162a1eed0c2c2916be215ced7322b0b4ad2c8497905c7399bd943cde9d27d57');
 assert.equal(hash(progressive.days.slice(0,7)),'a1094c04778e471be1f9081472fde65215d630d845ee2fbe1a688166be107b4b');
 assert.equal(hash(Object.fromEntries(Object.entries(progressive.lessons).filter(([k])=>+k<=7))),'67e6a5bd230dceb29d7103c05fd5cf1a10d63ac790d7eda7fd07c03af68cd27b');
});
test('old seven lesson event history replays unchanged and the next real lesson can complete and repeat',()=>{
 const p=adapter(),d=p.createDocument(),old=plain(catalog),oc=old.courses.find(c=>c.version==='sprout-3');oc.days=oc.days.slice(0,7);oc.lessons=Object.fromEntries(Object.entries(oc.lessons).filter(([k])=>+k<=7));
 for(let day=1;day<=7;day++)oc.lessons[day].forEach((t,i)=>{if(t.kind!=='warmup')p.submit(d,old,event(d,old,day,i),now);});
 const before=JSON.stringify(d);p.validateDocument(d,catalog);assert.equal(JSON.stringify(d),before);
 assert.equal(p.state(d,catalog,now).courses['sprout-3'].positions[8],0);
 for(const run of ['main','repeat'])progressive.lessons[8].forEach((t,i)=>p.submit(d,catalog,event(d,catalog,8,i,run),now));
 p.validateDocument(d,catalog);assert.equal(p.state(d,catalog,now).courses['sprout-3'].rewards.length,8);
 const day=p.calendar(d,catalog,'2026-01','sprout-3',now).days.find(x=>x.steps);assert.ok(day.new_characters.includes('只'));assert.ok(day.review_characters.includes('只'));assert.equal(p.state(d,catalog,now).mastery.confirmed,0);
});
test('last newly released lesson starts directly without rewarding skipped lessons',()=>{
 assert.equal(progressive.days.at(-1).day,15);const p=adapter(),d=p.createDocument();
 for(const [i,t] of progressive.lessons[15].entries())p.submit(d,catalog,event(d,catalog,15,i),now);
 assert.deepEqual(plain(p.state(d,catalog,now).courses['sprout-3'].rewards),[15]);assert.equal(p.state(d,catalog,now).courses['sprout-3'].positions[8],0);p.validateDocument(d,catalog);
});

test('new tasks teach classifier 只 in its intended spoken context instead of relying on isolated pronunciation',()=>{
 const tasks=Object.entries(progressive.lessons).filter(([day])=>Number(day)>=8).flatMap(([,ts])=>ts).filter(t=>t.char==='只'&&['learn','listen','review'].includes(t.kind));
 assert.ok(tasks.length>=3);for(const t of tasks)assert.equal(t.pronunciation_context,'一只小鸟');
});
