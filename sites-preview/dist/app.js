'use strict';
const main=document.querySelector('#main'), connection=document.querySelector('#connection'), voice=document.querySelector('#voice');
const OLD_KEY='sprout-sites-legacy-unused:', KEY='sprout-sites-pending-v1:';
let registry=null,course=null,activeRun='main',selectedDay=null,learningMode=null,calendarData=null,calendarMonth=null,calendarDate=null,calendarFilter='',calendarSerial=0,calendarError=null,calendarLoading=false;
let state=null,pending=null,storageProblem=false,busy=false,feedback=null,heard=false,audioTask=null,parentOpen=false;
let readSerial=0,mutationSerial=0,corruptEntries=[],autoSpeech=false;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=()=>globalThis.crypto?.randomUUID?.() || 'event-'+Date.now().toString(36)+'-'+Array.from(crypto.getRandomValues(new Uint32Array(3))).join('-');
function progressState(){return state?.courses?.[course?.version]||state;}
function currentDay(){return selectedDay || course?.days.find(d=>!progressState().rewards.includes(d.day))?.day || course?.days.at(-1)?.day || 1;}
function currentPosition(){return activeRun==='main'?progressState().positions[currentDay()]:state.runs.find(r=>r.course_version===course.version&&r.day===currentDay()&&r.run_id===activeRun)?.position||0;}
function currentTask(){return course.lessons[currentDay()][currentPosition()];}
function route(){return (location.hash.slice(1)||'home').split('/')[0];}
function chooseCourse(version){
 if(busy||pending)return false;
 const next=registry?.courses.find(c=>c.version===version);if(!next)return false;
 course=next;activeRun='main';selectedDay=null;feedback=null;stopAudio();
 if(location.hash.split('/')[1])location.hash='#'+route()+'/'+version;render();return true;
}
function startLesson(day,run='main'){
 if(busy||pending||storageProblem)return;
 selectedDay=day;activeRun=run;go('lesson');
}
function startPractice(day){
 if(!progressState().rewards.includes(day))return;
 const open=state.runs.find(r=>r.course_version===course.version&&r.day===day&&r.run_id!=='main'&&!r.complete);
 startLesson(day,open?.run_id||id());
}
function stopAudio(){globalThis.SproutSpeech?.cancel();voice.pause();voice.removeAttribute('src');voice.load();voice.onended=null;voice.onerror=null;heard=false;audioTask=null;learningMode=null;}
async function request(path,body){return SproutPreview.request(path,body);}

function readPending(){
 try {
  const found=[];corruptEntries=[];
  for(let i=0;i<localStorage.length;i++){
   const key=localStorage.key(i);if(!key?.startsWith(KEY)&&!key?.startsWith(OLD_KEY))continue;
   const raw=localStorage.getItem(key);
   try{const e=JSON.parse(raw);
    if(!e||typeof e.id!=='string'||(key!==KEY+e.id&&key!==OLD_KEY+e.id)||!Number.isInteger(e.step)||!Object.hasOwn(e,'answer')||(key.startsWith(OLD_KEY)?!Number.isInteger(e.day):typeof e.course_version!=='string'||typeof e.lesson_id!=='string'||typeof e.generation!=='string'))throw Error('记录损坏');found.push(e);
   }catch(err){corruptEntries.push({key,raw});}
  }
  storageProblem=corruptEntries.length>0;
  if(!pending)pending=found.sort((a,b)=>(a.course_version||'sprout-2').localeCompare(b.course_version||'sprout-2')||(a.day||0)-(b.day||0)||a.step-b.step||a.id.localeCompare(b.id))[0]||null;
 }catch(e){storageProblem=true;}
}
function removePending(event){
 // An event owns only its own key. Another tab can never lose its queued event here.
 const key=(event.course_version?KEY:OLD_KEY)+event.id,raw=localStorage.getItem(key);
 if(raw && JSON.parse(raw).id===event.id)localStorage.removeItem(key);
}
async function refreshState(){
 if(!state||busy)return;
 const serial=++readSerial,mutation=mutationSerial;
 try {
  const next=await request('/api/state');
  if(serial!==readSerial||mutation!==mutationSerial||busy)return;
  state=next;render();
  if(storageProblem)storageNotice();else if(pending)waitingNotice();else clearNotice();
 }catch(e){if(!pending&&!busy)notice('暂时无法刷新，当前显示上次成功读取的进度与日期。恢复页面或存储访问后再核对。','',[['重新读取进度',refreshState]]);}
}
async function refreshCurrentView(){
 const view=route();
 if(view==='home'||(view==='parent'&&parentOpen)){await refreshState();if(view==='parent'&&parentOpen)await loadCalendar(calendarMonth||state.calendar.date.slice(0,7));}
}
function notice(text,kind='',actions=[]){
 connection.innerHTML='';const box=document.createElement('div');box.className='status '+kind;const label=document.createElement('div');label.textContent=text;box.append(label);
 for(const [name,action] of actions){const b=document.createElement('button');b.textContent=name;b.onclick=action;box.append(b);}connection.append(box);
}
function clearNotice(){connection.innerHTML='';}
function storageNotice(){notice('浏览器暂存不可用或记录损坏。先不要继续答题，避免丢失未同步进度。','error', [['核对本机预览并清除本机暂存',async()=>{
 try{state=await request('/api/state');for(const entry of corruptEntries){if(localStorage.getItem(entry.key)===entry.raw)localStorage.removeItem(entry.key);}storageProblem=false;pending=null;readPending();clearNotice();render();if(pending)waitingNotice();}catch(e){notice('仍无法读取或暂存，请恢复页面或存储访问并检查浏览器存储权限。','error');}
 }]]);}
function waitingNotice(){notice('这一步还没有保存到本机预览存储。已暂存在这台设备，请勿清除浏览器数据；请检查浏览器存储权限后重试。本机暂存不等于已完成保存。','',[['重新尝试本机保存',()=>flush()]]);}
async function boot(){
 readPending();
 try{[registry,state]=await Promise.all([request('/api/course'),request('/api/state')]);course=registry.courses.find(c=>c.version==='sprout-3');render();
  if(storageProblem)storageNotice();else if(pending)await flush();
 }catch(e){main.innerHTML='<section class="gate"><h1>小花园暂时连不上</h1><p>请确认页面资源已加载，并允许本网站使用浏览器存储；隐私浏览或存储限制可能阻止保存。</p><button id="reload" class="primary">重新打开</button></section>';document.querySelector('#reload').onclick=()=>location.reload();if(pending)waitingNotice();}
}
function go(where){stopAudio();feedback=null;calendarSerial++;if(!['lesson','overview'].includes(where)){selectedDay=null;activeRun='main';}const destination=where==='lesson'?where+'/'+course.version+'/'+currentDay()+'/'+activeRun:where==='overview'?where+'/'+course.version+'/'+currentDay():where+'/'+course.version;if(location.hash==='#'+destination)render({navigation:true});else location.hash='#'+destination;}
function render({navigation=false}={}){
 if(!course||!state)return;stopAudio();
 const parts=(location.hash.slice(1)||'home').split('/'),view=parts[0];
 if(!['lesson','overview'].includes(view)){selectedDay=null;activeRun='main';}
 if(parts[1]){const found=registry.courses.find(c=>c.version===parts[1]);if(found)course=found;}
 if(['lesson','overview'].includes(view)&&parts[2]){
  const day=Number(parts[2]);if(course.days.some(d=>d.day===day)){selectedDay=day;activeRun=parts[3]||'main';}
 }
 if(view==='lesson'&&currentTask())renderLesson();
 else if(view==='lesson'){
  selectedDay=null;activeRun='main';
  const home='#home/'+course.version;
  if(globalThis.history?.replaceState)globalThis.history.replaceState(null,'',home);else location.hash=home;
  renderHome();
 }
 else if(view==='overview')renderOverview();
 else if(view==='parent')parentOpen?renderParent():renderGate();
 else renderHome();
 // Only intentional navigation resets reading position; state/calendar refreshes do not.
 if(navigation&&['home','overview','lesson'].includes(view))main.scrollIntoView({block:'start',behavior:'auto'});
}
const landscape=`<svg viewBox="0 0 440 310" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="阳光下，小屋旁的幼苗正在长大"><circle cx="333" cy="65" r="30" fill="#efc36f"/><path d="M240 49h39m-31 8h46" stroke="#f7f9ef" stroke-width="12" stroke-linecap="round"/><path d="M-30 270Q96 157 211 234T470 218V340H-30" fill="#c4d3b1"/><path d="M-10 293Q114 219 237 265T460 255V330H-10" fill="#9fb98c"/><path d="M108 161V270H237V161L174 105Z" fill="#fcf7de"/><path d="M90 166L174 94L254 166" fill="none" stroke="#b8794e" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/><rect x="150" y="207" width="43" height="63" rx="20" fill="#709471"/><circle cx="182" cy="242" r="3" fill="#f4d491"/><rect x="124" y="174" width="23" height="24" rx="4" fill="#d2dfb9"/><path d="M136 174v24m-12-12h23" stroke="#fff9e8" stroke-width="3"/><path d="M303 264V201" stroke="#527951" stroke-width="8" stroke-linecap="round"/><path d="M303 238Q258 234 263 207Q302 205 303 238M305 222Q345 221 340 189Q304 188 305 222" fill="#658d59"/><path d="M301 273q24 0 32-14h-61q7 14 29 14" fill="#b97c56"/><path d="M154 306q12-27 18-36" stroke="#e7d6ad" stroke-width="24"/><circle cx="66" cy="263" r="7" fill="#e2ad65"/><path d="M66 268v13" stroke="#6c8c5b" stroke-width="3"/><path d="M366 271l8-13 9 13" stroke="#67885d" stroke-width="4" fill="none"/></svg>`;
function courseSwitches(){return `<nav class="course-tabs" aria-label="课程区域">${registry.courses.map(c=>`<button id="course-${esc(c.version)}" aria-pressed="${course.version===c.version}">${esc(c.title)}</button>`).join('')}</nav>`;}
function bindCourseSwitches(){for(const c of registry.courses){const b=document.querySelector('#course-'+c.version);if(b)b.onclick=()=>{if(chooseCourse(c.version))go('home');};}}
function renderHome(){
 const p=progressState(),day=currentDay(),d=course.days[day-1],done=p.rewards.length===course.days.length,started=p.positions[day]>0;
 main.innerHTML=`${courseSwitches()}<section class="hero"><div class="hero-copy"><div class="eyebrow">${esc(course.title)} · 第 ${day} 课</div><h1>${done?'这一程的小花园，开花啦！':'今天，也长大一点点。'}</h1><p>${done?'这些汉字朋友，等你慢慢熟悉。':'走进「'+esc(d.title)+'」，和 5 个汉字交朋友。'}<br>一次学一点，随时可以休息。</p><button class="primary" id="start">${done?'再读一读第 1 课':started?'接着上次的冒险':'开始今天的冒险'}</button><div class="badge">${state.calendar.today_steps?'今天已尝试 '+state.calendar.today_steps+' 小步':'约 '+state.settings.reference_minutes+' 分钟参考，可分次完成'} · 没有倒计时</div></div><div class="art">${landscape}</div></section>
 <p class="mode-notice">点击朗读按钮，听普通话读字、词语和故事。使用设备语音，音色由设备决定；跟读和答对不等于已经掌握。</p>
 <div class="section-top"><h2>${course.area==='foundation'?'基础复习小花园':'小兔的阅读之旅'}</h2><span class="subtle">${p.rewards.length} / ${course.days.length} 朵小花 · 完成不等于掌握</span></div>
 <p class="subtle">每一课都可以先看内容，也可以自由选择从哪一课开始。跳过的课不会算作完成。</p>
 <section class="garden" aria-label="课程进度">${course.days.map(x=>`<article class="day-card ${p.rewards.includes(x.day)?'complete':x.day===day?'current':''}"><span class="plant" aria-hidden="true">${p.rewards.includes(x.day)?'🌼':esc(x.icon||'🌱')}</span><strong>第 ${x.day} 课 · ${esc(x.title)}</strong><p class="lesson-characters">${x.words.map(w=>esc(w.char)).join('　')}</p><small>${p.rewards.includes(x.day)?'已完成 · 可以再练':p.positions[x.day]>0?'已开始 · 随时接着学':'还没开始 · 可以直接学'}</small><div class="lesson-card-actions"><button id="preview-${x.day}" class="quiet" aria-label="查看第 ${x.day} 课 ${esc(x.title)} 的内容">看看内容</button><button id="lesson-${x.day}" aria-label="${p.rewards.includes(x.day)?'复习':p.positions[x.day]>0?'继续':'开始'}第 ${x.day} 课 ${esc(x.title)}">${p.rewards.includes(x.day)?'再练一次':p.positions[x.day]>0?'接着学':'开始学习'}</button></div></article>`).join('')}</section>
 <section class="home-bottom"><div class="note-box"><b>这一课的汉字朋友</b>${d.words.map(w=>esc(w.char)).join('　')}</div><div class="note-box"><b>不着急，我们慢慢来</b>认字 · 读词句 · 理解小故事 · 收下小花</div></section>
 <section class="roadmap"><div class="section-top"><h2>一步步走向 3000 字认读目标</h2></div><p>当前实际发布 ${registry.published_characters} 个不同目标字：基础 35 字 + 原创进阶 35 字。规划容量不等于已完成课程，也不保证掌握。</p><ol>${registry.stages.map(stage=>`<li><strong>${esc(stage.title)} · 累计 ${stage.target} 字</strong><span>${stage.status==='partial'?'首批内容可用，仍在扩充':'规划中，尚无可学习课件'}</span><small>${esc(stage.focus)}</small></li>`).join('')}</ol><p class="subtle">阶段是内部规划节点，不是年龄标准。没有完成课程就自动登记掌握的规则。</p></section>`;
 bindCourseSwitches();document.querySelector('#start').onclick=()=>done?startPractice(1):startLesson(day);
 for(const x of course.days){
  document.querySelector('#lesson-'+x.day).onclick=()=>p.rewards.includes(x.day)?startPractice(x.day):startLesson(x.day);
  document.querySelector('#preview-'+x.day).onclick=()=>{if(busy||pending)return;selectedDay=x.day;activeRun='main';go('overview');};
 }
}
function renderOverview(){
 const day=currentDay(),d=course.days.find(x=>x.day===day);if(!d)return go('home');
 const p=progressState(),tasks=course.lessons[day],review=[...new Set(tasks.filter(t=>t.kind==='review').map(t=>t.char))];
 const kinds={warmup:'听一听，准备出发',review:'听音温习汉字',learn:'认识汉字和词语',listen:'听音找汉字',match:'词语配对',sentence:'听读故事和句子',comprehension:'回答故事问题',component:'发现字形联系',roleplay:'换个角色说一说',reward:'收下学习小花'};
 const activities=[...new Set(tasks.map(t=>kinds[t.kind]||t.title))];
 main.innerHTML=`<section class="lesson-overview"><div class="eyebrow">${esc(course.title)} · 第 ${day} 课</div><h1>${esc(d.title)}</h1><p>先看看这一课，喜欢就出发。</p><div class="actions"><button class="quiet" id="overview-back">返回课程列表</button><button class="primary" id="overview-start">${p.rewards.includes(day)?'这一课再练一次':p.positions[day]>0?'接着学这一课':'从这一课开始'}</button></div><p class="subtle">查看内容不会记为学习或完成。不用先学前面的课，也不会替你完成跳过的课。</p><section class="overview-words" aria-label="本课汉字和词语">${d.words.map(w=>`<article class="overview-word"><strong class="char">${esc(w.char)}</strong><span class="word">${esc(w.word)}</span></article>`).join('')}</section><section class="overview-story"><h2>这一课读什么</h2>${d.sentences.map(text=>`<p class="sentence">${esc(text)}</p>`).join('')}</section>${review.length?`<p class="subtle">本课也会温习：${review.map(esc).join('、')}。没学过也可以跟着朗读认识，不影响从本课开始。</p>`:''}<section class="overview-activities"><h2>会玩哪些练习</h2><ul>${activities.map(label=>`<li>${esc(label)}</li>`).join('')}</ul><p class="subtle">共 ${tasks.length} 小步，可以中途休息，之后接着学。</p></section></section>`;
 document.querySelector('#overview-back').onclick=()=>go('home');
 document.querySelector('#overview-start').onclick=()=>p.rewards.includes(day)?startPractice(day):startLesson(day);
}
function renderLesson(){
 const day=currentDay(),d=course.days[day-1],step=currentPosition(),t=currentTask(),total=course.lessons[day].length;
 if(!t)return go('home');
 const spokenTitle=(t.kind==='listen'||t.kind==='review')?'听声音，找汉字':t.kind==='sentence'?'听故事，读句子':t.title;
 const type={warmup:'出发前，听一听',review:'先见见老朋友',learn:'认识新朋友',listen:'小耳朵时间',match:'词语配对',sentence:'读一个小故事',reward:'每次尝试，都值得鼓励',comprehension:'读懂小故事',component:'发现字形小联系',roleplay:'换个角色说一说'}[t.kind];
 let content='';
 if(t.kind==='learn')content=`<div class="learning-card"><div class="learning-picture">${SproutArt.character(t.char)}</div><div><div class="character">${esc(t.char)}</div><div class="word">${esc(t.word)}</div></div></div>`;
 else if(t.kind==='match')content=`<div class="match-prompt"><div class="character">${esc(t.char)}</div><p>看一看，哪个词语是它的朋友？</p></div>`;
 else if(t.kind==='review'||t.kind==='listen')content=`<div class="listening-mascot">${SproutArt.mascot('listen')}</div><p>小耳朵听一听，再找汉字朋友。</p>`;
 else if(t.kind==='sentence')content=`<div class="story-picture">${SproutArt.story(day,d.sentences.indexOf(t.text),course.version)}</div><p class="sentence">${esc(t.text)}</p><p class="subtle">点击朗读听完整故事，也可以跟着读一读；这不是无提示认读检查。</p>`;
 else if(t.kind==='comprehension'||t.kind==='component'||t.kind==='roleplay')content=`<p class="warmup-text">${esc(t.text)}</p>`;
 else if(t.kind==='reward')content=`<div class="reward-flower" aria-hidden="true">🌼</div><p class="warmup-text">${esc(t.text)}</p>`;
 else content=`<div class="listening-mascot">${SproutArt.mascot('listen')}</div><p class="warmup-text">${esc(t.kind==='warmup'?'听一听，读一读，再试一试。准备好了，就点继续。':t.text)}</p>`;
 main.innerHTML=`<section class="lesson-top"><div><span class="eyebrow">${activeRun==='main'?'第':'复习第'} ${day} 课 · ${esc(d.title)}</span><h2>${type}</h2></div><button class="quiet" id="pause">先休息一下</button></section><progress class="progress" aria-label="本课进度" value="${step}" max="${total}"></progress><section class="activity"><div class="eyebrow">第 ${step+1} 小步 / ${total}</div><h1>${esc(spokenTitle)}</h1>${content}<section class="learning-mode" aria-label="学习方式"><div class="actions"><button class="primary audio" id="play">▶ 点我听一听</button></div><p class="audio-note" id="audio-note" role="status">点一下朗读，听完就可以回答或继续。</p><small id="voice-status">${esc(globalThis.SproutSpeech?.status()||'朗读组件加载失败，请刷新页面')}</small><details class="optional-mode"><summary>其他练习方式（可选）</summary><details id="adult-prompt" class="adult-prompt"><summary>仅给大人：展开带读提示（孩子先不看）</summary><p>${esc(t.adult_prompt||t.text||t.char||'')}</p></details><div class="actions"><button id="adult-read">大人已带读 / 讲解</button><button id="silent-read">静音看字 / 对照练习</button><button id="reread" hidden>重新给大人看提示</button></div></details></section>${t.options?`<div class="options">${t.options.map(o=>`<button class="option ${t.kind==='match'?'word-option':''}" data-answer="${esc(o)}" disabled>${t.kind==='match'?`<span class="option-picture">${SproutArt.word(o,t.char)}</span>`:''}<span class="option-label">${esc(o)}</span></button>`).join('')}</div>`:`<div class="actions"><button class="primary" id="advance" disabled>${t.kind==='reward'?'收下今天的小花':'这一步练好了，继续'}</button></div>`}<div id="feedback" role="status" aria-live="polite" tabindex="-1"></div></section>`;
 document.querySelector('#pause').onclick=()=>go('home');
 const playButton=document.querySelector('#play');if(playButton)playButton.onclick=()=>play(t);
 document.querySelector('#adult-read').onclick=()=>acknowledgeMode('adult');
 document.querySelector('#silent-read').onclick=()=>acknowledgeMode('silent');
 document.querySelector('#reread').onclick=()=>{if(busy||pending||storageProblem)return;stopAudio();document.querySelectorAll('[data-answer],#advance').forEach(b=>b.disabled=true);const prompt=document.querySelector('#adult-prompt');prompt.hidden=false;prompt.open=true;document.querySelector('#audio-note').textContent='重新带读时先不让孩子看提示。结束带读后会隐藏提示，再开始选字。';};
 document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>submit(b.dataset.answer,t));
 const next=document.querySelector('#advance');if(next)next.onclick=()=>submit(null,t);
 if(autoSpeech&&!pending&&!storageProblem)play(t);
}
function hideAdultPrompt(){
 const prompt=document.querySelector('#adult-prompt');if(prompt){prompt.open=false;prompt.hidden=true;}
 const reread=document.querySelector('#reread');if(reread)reread.hidden=false;
}
function acknowledgeMode(mode){
 if(busy||pending||storageProblem||!['adult','silent'].includes(mode))return;
 stopAudio();autoSpeech=false;heard=true;learningMode=mode;
 hideAdultPrompt();
 const t=currentTask(),note=document.querySelector('#audio-note');
 if(note)note.textContent=mode==='adult'?'已按成人带读 / 讲解记录，不是自主认读检查。':((t.kind==='listen'||t.kind==='review')?'静音对照提示：'+t.adult_prompt+'。对照选字，不是听音检查。':'静音练习已选择，需要时可以请大人帮忙；不计自主认读。');
 enableAnswers();
}
function enableAnswers(){if(busy||pending||storageProblem||!heard)return;document.querySelectorAll('[data-answer],#advance').forEach(b=>b.disabled=false);}
function play(t){
 if(busy||pending||storageProblem)return;stopAudio();autoSpeech=true;hideAdultPrompt();audioTask=t;
 const b=document.querySelector('#play'),note=document.querySelector('#audio-note');if(!b)return;
 document.querySelectorAll('[data-answer],#advance').forEach(x=>x.disabled=true);
 b.textContent='↻ 再听一次';note.textContent='正在准备朗读…';
 const engine=globalThis.SproutSpeech;
 const fail=message=>{if(audioTask!==t)return;heard=false;learningMode=null;note.textContent=message+' 这一步还没有完成；请点上方按钮重试。';document.querySelectorAll('[data-answer],#advance').forEach(x=>x.disabled=true);};
 if(!engine)return fail('朗读组件未加载，请刷新页面。');
 engine.speak(engine.taskText(t),{
  start:label=>{if(audioTask!==t)return;note.textContent='正在朗读，听完就可以继续。';const status=document.querySelector('#voice-status');if(status)status.textContent='设备语音：'+label;},
  end:()=>{if(audioTask!==t)return;heard=true;learningMode='audio';note.textContent='听到了吗？来试一试。没听清可以再听一次。';enableAnswers();},
  error:fail
 });
}
async function submit(answer,t){
 if(busy||pending||storageProblem||!heard)return;
 const e={id:id(),course_version:course.version,lesson_id:course.days[currentDay()-1].id,run_id:activeRun,step:currentPosition(),answer,mode:learningMode,occurred_at:new Date().toISOString(),client_timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',generation:state.generation};
 readPending();if(storageProblem){storageNotice();return;}if(pending){waitingNotice();return;}
 try{localStorage.setItem(KEY+e.id,JSON.stringify(e));pending=e;}catch(err){storageProblem=true;storageNotice();return;}
 feedback={task:t,answer};await flush();
}
async function flush(){
 if(busy||!pending)return;const submitting=pending;busy=true;mutationSerial++;document.querySelectorAll('[data-answer],#advance').forEach(b=>b.disabled=true);
 notice('正在保存这一步，请稍等…');
 try {
  state=await request('/api/event',submitting);
  removePending(submitting);pending=null;readPending();clearNotice();
  if(pending){feedback=null;render();waitingNotice();}else if(feedback && route()==='lesson')showFeedback();else render();
 }catch(e){
  if(e.status===400){notice('本机预览进度与这条暂存记录不同，可能在另一页学习过或本机存储发生变化。这条答案仍保留在本机；请先核对，不会自动丢弃或改投新课程。','error', [['核对本机预览进度（保留暂存）',async()=>{
   try{
    state=await request('/api/state');
    const scope=submitting.course_version||'sprout-2',label=submitting.lesson_id||('基础第 '+submitting.day+' 课');
    notice('本机预览进度已读取。仍保留：'+scope+' / '+label+' / 第 '+(submitting.step+1)+' 步，答案：'+(submitting.answer??'确认练习')+'。确认放弃只移除本机这一条未接受的暂存，不修改本机已保存记录。','error',[
     ['继续保留这条暂存',waitingNotice],
     ['确认放弃这条暂存',()=>{try{removePending(submitting);pending=null;readPending();feedback=null;clearNotice();render();if(storageProblem)storageNotice();else if(pending)waitingNotice();}catch(err){storageProblem=true;storageNotice();}}]
    ]);
   }catch(err){waitingNotice();}
  }]]);}else waitingNotice();
 }finally{busy=false;setSettingsDisabled(false);}
}
function showFeedback(){
 const speakFeedback=learningMode==='audio';stopAudio();const f=feedback;feedback=null;const isQuestion=Object.hasOwn(f.task,'answer');
 const correct=!isQuestion||f.answer===f.task.answer;
 const heading=f.task.kind==='reward'?'今天的小花，已经种好啦！':isQuestion?(correct?'答对啦，找到朋友了！':'这次还没找对，一起看看！'):'又向前走了一小步！';
 const extra=isQuestion&&!correct?'你选了「'+f.answer+'」。这个朋友是「'+f.task.answer+'」，下次再见见它。':'这一步已经保存，可以随时休息。';
 const box=document.querySelector('#feedback');if(!box)return render();
 // Retain the child's original choice and show the correct example, with shape + words.
 document.querySelectorAll('[data-answer]').forEach(button=>{
  if(button.dataset.answer===f.answer){
   button.classList.add(correct?'answer-correct':'answer-try');
   button.innerHTML+=`<span class="choice-result"><span aria-hidden="true">${correct?'✓':'↻'}</span>${correct?'答对了':'还不是这个'}</span>`;
   button.setAttribute('aria-label',button.dataset.answer+'，'+(correct?'答对了':'还不是这个'));
  }else if(!correct&&button.dataset.answer===f.task.answer){
   button.classList.add('answer-example');
   button.innerHTML+='<span class="choice-result"><span aria-hidden="true">✓</span>看看这个</span>';
   button.setAttribute('aria-label',button.dataset.answer+'，正确的朋友，看看这个');
  }
 });
 const mark=correct?'<path d="M13 33l13 13 27-30"/>':'<path d="M15 24a21 21 0 1 1-2 22M15 24V10M15 24H29"/>';
 box.innerHTML=`<div class="feedback ${correct?'feedback-success':'feedback-try'}"><div class="feedback-hero"><span class="feedback-symbol" aria-hidden="true"><svg viewBox="0 0 64 64">${mark}</svg></span><div class="feedback-copy"><strong>${esc(heading)}</strong><p>${esc(extra)}</p></div><div class="feedback-mascot">${SproutArt.mascot(correct?'success':'try')}</div></div><div class="actions"><button class="audio" id="feedback-play">▶ 听一听鼓励</button><button class="primary" id="next">${f.task.kind==='reward'?'回到小花园':'下一小步'}</button></div><p id="feedback-audio-note" role="status"></p></div>`;
 document.querySelectorAll('[data-answer],#advance,#play,#adult-read,#silent-read,#reread').forEach(button=>button.disabled=true);
 const readFeedback=()=>{const engine=globalThis.SproutSpeech,note=document.querySelector('#feedback-audio-note');if(!engine)return;if(note)note.textContent='正在朗读…';engine.speak(heading+'。'+extra,{end:()=>{if(note)note.textContent='可以点下一小步，也可以再听一次。';},error:message=>{if(note)note.textContent=message+' 练习结果已保存，可以点击重听。';}});};
 document.querySelector('#feedback-play').onclick=readFeedback;
 if(speakFeedback)readFeedback();
 document.querySelector('#next').onclick=()=>{if(f.task.kind==='reward'){selectedDay=null;activeRun='main';go('home');}else render({navigation:true});};
 box.focus({preventScroll:true});box.scrollIntoView({block:'nearest',behavior:'auto'});
}
function renderGate(){
 main.innerHTML='<section class="gate"><div class="eyebrow">留给大人的一小扇窗</div><h1>家长小窗</h1><p>陪孩子看看今天的尝试。<br>这个小问题只防误触，不是安全密码。</p><form id="gate"><label for="gate-answer">3 + 4 等于几？</label><input id="gate-answer" inputmode="numeric" autocomplete="off" required><button class="primary" type="submit">进入家长小窗</button><p id="gate-note" role="status"></p></form><button class="quiet" id="home">回小花园</button></section>';
 document.querySelector('#home').onclick=()=>go('home');document.querySelector('#gate').onsubmit=async e=>{e.preventDefault();if(document.querySelector('#gate-answer').value.trim()==='7'){parentOpen=true;renderParent();await refreshState();await loadCalendar(calendarMonth||state.calendar.date.slice(0,7));}else document.querySelector('#gate-note').textContent='再算一算，也可以请大人帮忙。';};
}
function renderParent(){
 const cal=state.calendar,p=progressState();
 main.innerHTML=`<section class="dashboard-head"><div class="eyebrow">陪伴，比催促更重要</div><h1>看见每一点成长</h1><p>完成不等于掌握。这里记录的是练习表现，不是能力评测。暂稳认读：尚未评估（无无提示检查证据）。</p><button class="quiet" id="home">回小花园</button></section>${courseSwitches()}<section class="metrics"><div class="metric">今天的尝试<b>${cal.today_steps} <small>小步</small></b><span class="subtle">${cal.date}</span></div><div class="metric">本周陪伴<b>${cal.week_active_days} <small>天</small></b><span class="subtle">本周共 ${cal.week_steps} 小步</span></div><div class="metric">当前课程小花<b>${p.rewards.length} <small>/ ${course.days.length} 朵</small></b><span class="subtle">首次完成固定 1 朵，复习不重复领奖</span></div></section><p class="subtle">按 ${esc(cal.timezone)} 统计，周一开周。小步包含看故事和收花，不等于识字量；没有计时或连续签到要求。</p>
 <section class="calendar-section" aria-labelledby="calendar-heading"><h2 id="calendar-heading">学习日历</h2><div class="calendar-toolbar"><button id="month-prev" aria-label="上个月">← 上月</button><strong id="calendar-title"></strong><button id="month-next" aria-label="下个月">下月 →</button><button id="month-today">回到今天</button><label for="calendar-filter">课程</label><select id="calendar-filter"><option value="">全部课程</option>${registry.courses.map(c=>`<option value="${esc(c.version)}">${esc(c.title)}</option>`).join('')}</select></div><p id="calendar-status" role="status" aria-live="polite">正在读取已保存的记录…</p><div class="calendar-layout"><div><div class="week-labels" aria-hidden="true">${['一','二','三','四','五','六','日'].map(x=>`<span>${x}</span>`).join('')}</div><div id="calendar-grid" class="calendar-grid" aria-label="按日期选择学习记录"></div></div><section id="calendar-detail" class="calendar-detail" aria-live="polite"></section></div></section>
 <div class="section-top"><h2>${course.days.flatMap(d=>d.words).length} 位汉字朋友 · ${esc(course.title)}</h2></div><section class="word-grid">${course.days.flatMap(d=>d.words).map(w=>{const s=p.stats[w.char];return `<article class="word-status ${s?.wrong?'revisit':''}"><strong>${esc(w.char)}</strong><span>${s?(s.wrong?'建议再见一面':'正在熟悉'):'还未练习'}</span><small>${s?'尝试 '+s.attempts+' 次 · 答对 '+s.correct+' 次':'还没有答题记录'}</small></article>`;}).join('')}</section>
 <section class="note-box"><b>逐步扩展，不赶进度</b>当前发布 ${registry.published_characters} 字，规划至 3000 字。跟读、选择题答对和点完成都不代表稳定认读。首批进阶是原创内容，不是外来教材复刻；当前使用设备普通话语音，非真人录音；不同设备音色可能不同，教学试用尚待验收。</section>
 <section class="settings"><h2>家庭学习目标</h2><p class="subtle">目标不是掌握保证。每日新字和参考分钟是安排建议，不记录为实际用时。</p><form id="settings-form"><label for="target-characters">认读目标字数</label><input id="target-characters" type="number" min="1" max="3000" value="${state.settings.target_characters}" required><label for="target-date">目标日期（可留空）</label><input id="target-date" type="date" value="${esc(state.settings.target_date||'')}"><label for="daily-new">每日新字参考</label><input id="daily-new" type="number" min="1" max="20" value="${state.settings.daily_new_target}" required><label for="reference-minutes">每次分钟参考</label><input id="reference-minutes" type="number" min="1" max="60" value="${state.settings.reference_minutes}" required><button id="save-target" type="submit">保存目标</button><p id="settings-status" role="status"></p></form></section>
 <section class="section-top"><h2>保存这段成长</h2></section><p>Sites 预览的练习记录与目标只保存在当前浏览器，不上传到服务器，也不与极空间同步。清除浏览器数据或更换设备后不会保留。</p><p class="subtle">本页用于查看和试用界面，请勿填写私人日期或当作正式学习档案。NAS 版本的数据库备份与恢复不适用于此预览。</p>`;
 document.querySelector('#home').onclick=()=>go('home');
 for(const c of registry.courses){document.querySelector('#course-'+c.version).onclick=()=>{if(chooseCourse(c.version)){renderParent();loadCalendar(calendarMonth||cal.date.slice(0,7));}};}
 document.querySelector('#calendar-filter').value=calendarFilter;
 document.querySelector('#calendar-filter').onchange=e=>{calendarFilter=e.target.value;loadCalendar(calendarMonth||cal.date.slice(0,7));};
 document.querySelector('#month-prev').onclick=()=>loadCalendar(shiftMonth(calendarMonth||cal.date.slice(0,7),-1));
 document.querySelector('#month-next').onclick=()=>loadCalendar(shiftMonth(calendarMonth||cal.date.slice(0,7),1));
 document.querySelector('#month-today').onclick=()=>{calendarDate=cal.date;loadCalendar(cal.date.slice(0,7));};
 document.querySelector('#settings-form').onsubmit=saveSettings;
 setSettingsDisabled(busy);
 if(calendarData)renderCalendar();
}
function shiftMonth(month,delta){const [year,num]=month.split('-').map(Number),index=year*12+num-1+delta;return Math.floor(index/12)+'-'+String(index%12+1).padStart(2,'0');}
async function loadCalendar(month){
 const serial=++calendarSerial,mutation=mutationSerial,filter=calendarFilter;calendarMonth=month;calendarLoading=true;calendarError=null;
 const status=document.querySelector('#calendar-status');if(status)status.textContent='正在读取 '+month+' 的已保存记录…';
 try{
  const data=await request('/api/calendar?month='+encodeURIComponent(month)+(filter?'&course_version='+encodeURIComponent(filter):''));
  if(serial!==calendarSerial||mutation!==mutationSerial||route()!=='parent'||!parentOpen)return;
  calendarData=data;calendarLoading=false;calendarError=null;if(!calendarDate?.startsWith(month))calendarDate=data.today.startsWith(month)?data.today:month+'-01';renderCalendar();
 }catch(e){if(serial!==calendarSerial)return;calendarLoading=false;calendarError='日历未更新（请求 '+month+'）。'+(calendarData?'仍显示上次读取的 '+calendarData.month+'（'+calendarData.updated_at+'）':'尚无已读取数据')+'，请恢复页面或存储访问后重试。';const box=document.querySelector('#calendar-status');if(box)box.textContent=calendarError;}
}
function renderCalendar(){
 if(!calendarData||!document.querySelector('#calendar-grid'))return;
 const data=calendarData;document.querySelector('#calendar-title').textContent=data.month;
 document.querySelector('#calendar-status').textContent=calendarError||(calendarLoading?'正在读取 '+calendarMonth+'；仍显示上次读取的 '+data.month+'。':'已读取 '+data.updated_at+' · '+data.timezone+'。'+data.time_note+(pending?' 本机还有待同步记录，未计入日历。':''));
 document.querySelector('#calendar-grid').innerHTML='<span class="calendar-blank" aria-hidden="true"></span>'.repeat(data.leading_empty)+data.days.map(d=>`<button id="date-${d.date}" class="calendar-day ${d.date===data.today?'today':''}" aria-pressed="${d.date===calendarDate}" aria-label="${d.date}，${d.steps?d.steps+' 小步，完成 '+d.completed.length+' 次课程':'暂无已保存记录'}"><strong>${Number(d.date.slice(-2))}</strong><small>${d.completed.length?'🌼 完成':d.steps?'· 有记录':''}</small></button>`).join('');
 for(const d of data.days)document.querySelector('#date-'+d.date).onclick=()=>selectDate(d.date);
 renderDateDetail();
}
function selectDate(value){calendarDate=value;renderCalendar();document.querySelector('#date-'+value)?.focus({preventScroll:true});}
function renderDateDetail(){
 const d=calendarData.days.find(x=>x.date===calendarDate),box=document.querySelector('#calendar-detail');if(!box||!d)return;
 const source={preview_device_saved:'设备时间无效，按本机保存日期统计',legacy_saved:'旧版记录按保存日期统计',invalid_client_saved:'设备时间无效，按保存日期统计',client_reported:'按设备报告的发生时间统计'},mode={adult:'成人带读 / 讲解',silent:'静音 / 对照练习',audio:'系统音频辅助',legacy_unknown:'旧版方式未知'};
 box.innerHTML=`<h3>${esc(d.date)}</h3>${!d.steps?'<p>这天暂无已保存的学习记录</p><p class="subtle">没有记录不代表失败，也没有需要补的签到。</p>':`<p><b>${d.steps} 学习小步</b>（含故事、收花等）</p><p><b>新学卡：</b>${d.new_characters.map(esc).join('、')||'无'}<br><small>当天练过的新学卡，不表示第一次认识或已经掌握。</small></p><p><b>复习：</b>${d.review_characters.map(esc).join('、')||'无'} · ${d.review_questions} 题 / 答对 ${d.review_correct} 题</p><p><b>其他练习：</b>${d.other_questions} 题 / 答对 ${d.other_correct} 题</p><p><b>完成课程：</b>${d.completed.length?d.completed.map(x=>esc(x.title)+(x.run_id==='main'?'':'（复习）')).join('、'):'这天有练习，尚无整课完成记录'}</p><p><b>课程来源：</b>${d.lessons.map(x=>esc(registry.courses.find(c=>c.version===x.course_version)?.title||x.course_version)+' / '+esc(x.title)).filter((x,i,a)=>a.indexOf(x)===i).join('；')}</p><p>${d.sources.map(x=>esc(source[x]||x)).join('；')}</p><p>${d.modes.map(x=>esc(mode[x]||x)).join('；')}。不计为自主认读。</p>`}`;
}
function setSettingsDisabled(disabled){
 document.querySelectorAll('#target-characters,#target-date,#daily-new,#reference-minutes,#save-target').forEach(control=>control.disabled=disabled);
}
async function saveSettings(e){
 e.preventDefault();if(busy)return;
 const box=document.querySelector('#settings-status');
 const values={target_characters:Number(document.querySelector('#target-characters').value),target_date:document.querySelector('#target-date').value||null,daily_new_target:Number(document.querySelector('#daily-new').value),reference_minutes:Number(document.querySelector('#reference-minutes').value)};
 // Settings are mutations too: invalidate older state reads and serialize writes.
 busy=true;mutationSerial++;readSerial++;setSettingsDisabled(true);box.textContent='正在保存目标…';
 try{
  state.settings=await request('/api/settings',values);
  const liveBox=document.querySelector('#settings-status');if(route()==='parent'&&liveBox)liveBox.textContent='目标已保存；参考安排不是完成或掌握保证。';
 }catch(error){
  const liveBox=document.querySelector('#settings-status');if(route()==='parent'&&liveBox)liveBox.textContent='没有保存，请核对目标范围、日期与连接后重试。';
 }finally{
  busy=false;setSettingsDisabled(false);
  // A month read superseded by this mutation must not stay permanently loading.
  if(calendarLoading&&route()==='parent'&&parentOpen)await loadCalendar(calendarMonth||state.calendar.date.slice(0,7));
 }
}

document.querySelector('#parent-link').onclick=()=>go('parent');
window.addEventListener('hashchange',async()=>{feedback=null;render({navigation:true});await refreshCurrentView();});
window.addEventListener('focus',refreshCurrentView);
window.addEventListener('storage',e=>{if((!e.key?.startsWith(KEY)&&!e.key?.startsWith(OLD_KEY))||busy)return;feedback=null;pending=null;readPending();if(storageProblem)storageNotice();else if(pending)waitingNotice();else refreshState();});
setInterval(refreshCurrentView,60000);
window.addEventListener('pagehide',stopAudio);
if(globalThis.speechSynthesis?.addEventListener) speechSynthesis.addEventListener('voiceschanged',()=>{const status=document.querySelector('#voice-status');if(status)status.textContent=SproutSpeech.status();});
window.addEventListener('online',()=>pending?flush():null);
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
boot();
