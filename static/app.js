'use strict';
const main=document.querySelector('#main'), connection=document.querySelector('#connection'), voice=document.querySelector('#voice');
const KEY='sprout-pending-v2:';
let course=null,state=null,pending=null,storageProblem=false,busy=false,feedback=null,heard=false,audioTask=null,parentOpen=false;
let readSerial=0,mutationSerial=0,corruptEntries=[];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=()=>globalThis.crypto?.randomUUID?.() || 'event-'+Date.now().toString(36)+'-'+Array.from(crypto.getRandomValues(new Uint32Array(3))).join('-');
function currentDay(){return state?Math.min(state.rewards.length+1,7):1;}
function currentTask(){const day=currentDay();return course.lessons[day][state.positions[day]];}
function stopAudio(){voice.pause();voice.removeAttribute('src');voice.load();voice.onended=null;voice.onerror=null;heard=false;audioTask=null;}
async function request(path,body){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),9000);
 try {const res=await fetch(path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:ctrl.signal,cache:'no-store'});
  const data=await res.json();if(!res.ok){const error=new Error(data.error||'连接暂时中断');error.status=res.status;throw error;}return data;
 } finally {clearTimeout(timer);}
}
function readPending(){
 try {
  const found=[];corruptEntries=[];
  for(let i=0;i<localStorage.length;i++){
   const key=localStorage.key(i);if(!key?.startsWith(KEY))continue;
   const raw=localStorage.getItem(key);
   try{const e=JSON.parse(raw);
    if(!e||typeof e.id!=='string'||key!==KEY+e.id||!Number.isInteger(e.day)||!Number.isInteger(e.step)||!Object.hasOwn(e,'answer'))throw Error('记录损坏');found.push(e);
   }catch(err){corruptEntries.push({key,raw});}
  }
  storageProblem=corruptEntries.length>0;
  if(!pending)pending=found.sort((a,b)=>a.day-b.day||a.step-b.step||a.id.localeCompare(b.id))[0]||null;
 }catch(e){storageProblem=true;}
}
function removePending(event){
 // An event owns only its own key. Another tab can never lose its queued event here.
 const key=KEY+event.id,raw=localStorage.getItem(key);
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
 }catch(e){if(!pending&&!busy)notice('暂时无法刷新，当前显示上次成功读取的进度与日期。恢复连接后再核对。','',[['重新读取进度',refreshState]]);}
}
async function refreshCurrentView(){
 const route=location.hash.slice(1)||'home';
 if(route==='home'||(route==='parent'&&parentOpen))await refreshState();
}
function notice(text,kind='',actions=[]){
 connection.innerHTML='';const box=document.createElement('div');box.className='status '+kind;const label=document.createElement('div');label.textContent=text;box.append(label);
 for(const [name,action] of actions){const b=document.createElement('button');b.textContent=name;b.onclick=action;box.append(b);}connection.append(box);
}
function clearNotice(){connection.innerHTML='';}
function storageNotice(){notice('浏览器暂存不可用或记录损坏。先不要继续答题，避免丢失未同步进度。','error', [['核对服务器并清除本机暂存',async()=>{
 try{state=await request('/api/state');for(const entry of corruptEntries){if(localStorage.getItem(entry.key)===entry.raw)localStorage.removeItem(entry.key);}storageProblem=false;pending=null;readPending();clearNotice();render();if(pending)waitingNotice();}catch(e){notice('仍无法读取或暂存，请恢复连接并检查浏览器存储权限。','error');}
 }]]);}
function waitingNotice(){notice('这一步还没有同步到家庭服务器。已暂存在这台设备，请勿清除浏览器数据；恢复连接后再继续。暂存不是离线学习。','',[['重新连接并同步',()=>flush()]]);}
async function boot(){
 readPending();
 try{[course,state]=await Promise.all([request('/api/course'),request('/api/state')]);render();
  if(storageProblem)storageNotice();else if(pending)await flush();
 }catch(e){main.innerHTML='<section class="gate"><h1>小花园暂时连不上</h1><p>请检查是否与服务器连在同一个家庭 Wi-Fi，服务器是否已开启。</p><button id="reload" class="primary">重新打开</button></section>';document.querySelector('#reload').onclick=()=>location.reload();if(pending)waitingNotice();}
}
function go(where){stopAudio();feedback=null;if(location.hash==='#'+where)render();else location.hash=where;}
function render(){
 if(!course||!state)return;stopAudio();
 const route=location.hash.slice(1)||'home';
 if(route==='lesson' && state.rewards.length<7)renderLesson();
 else if(route==='parent')parentOpen?renderParent():renderGate();
 else renderHome();
}
const landscape=`<svg viewBox="0 0 440 310" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="阳光下，小屋旁的幼苗正在长大"><circle cx="333" cy="65" r="30" fill="#efc36f"/><path d="M240 49h39m-31 8h46" stroke="#f7f9ef" stroke-width="12" stroke-linecap="round"/><path d="M-30 270Q96 157 211 234T470 218V340H-30" fill="#c4d3b1"/><path d="M-10 293Q114 219 237 265T460 255V330H-10" fill="#9fb98c"/><path d="M108 161V270H237V161L174 105Z" fill="#fcf7de"/><path d="M90 166L174 94L254 166" fill="none" stroke="#b8794e" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/><rect x="150" y="207" width="43" height="63" rx="20" fill="#709471"/><circle cx="182" cy="242" r="3" fill="#f4d491"/><rect x="124" y="174" width="23" height="24" rx="4" fill="#d2dfb9"/><path d="M136 174v24m-12-12h23" stroke="#fff9e8" stroke-width="3"/><path d="M303 264V201" stroke="#527951" stroke-width="8" stroke-linecap="round"/><path d="M303 238Q258 234 263 207Q302 205 303 238M305 222Q345 221 340 189Q304 188 305 222" fill="#658d59"/><path d="M301 273q24 0 32-14h-61q7 14 29 14" fill="#b97c56"/><path d="M154 306q12-27 18-36" stroke="#e7d6ad" stroke-width="24"/><circle cx="66" cy="263" r="7" fill="#e2ad65"/><path d="M66 268v13" stroke="#6c8c5b" stroke-width="3"/><path d="M366 271l8-13 9 13" stroke="#67885d" stroke-width="4" fill="none"/></svg>`;
function renderHome(){
 const day=currentDay(),d=course.days[day-1],done=state.rewards.length===7,started=state.positions[day]>0;
 main.innerHTML=`<section class="hero"><div class="hero-copy"><div class="eyebrow">小小识字家 · 第 ${day} 站 / 共 7 站</div><h1>${done?'一周的小花园，开花啦！':'今天，也长大一点点。'}</h1><p>${done?'35 个汉字朋友，等你慢慢熟悉。':'走进「'+esc(d.title)+'」，和 5 个汉字交朋友。'}<br>一次学一点，随时可以休息。</p><button class="primary" id="start">${done?'看看我的小花园':started?'接着上次的冒险':'开始今天的冒险'}</button><div class="badge">${state.calendar.today_steps?'今天已尝试 '+state.calendar.today_steps+' 小步':'约 20 分钟，也可以分几次完成'} · 没有倒计时</div></div><div class="art">${landscape}</div></section>
 <div class="section-top"><h2>我的七日小花园</h2><span class="subtle">${state.rewards.length} / 7 朵小花 · 每一朵都来自尝试</span></div>
 <section class="garden" aria-label="七日成长">${course.days.map(x=>`<div class="day-card ${state.rewards.includes(x.day)?'complete':x.day===day?'current':'future'}"><span class="plant">${state.rewards.includes(x.day)?'🌼':x.day===day?'🌱':'·'}</span><strong>第 ${x.day} 天</strong><small>${esc(x.title)}</small><small>${state.rewards.includes(x.day)?'已完成':x.day===day?'等你来玩':'还没出发'}</small></div>`).join('')}</section>
 <section class="home-bottom"><div class="note-box"><b>今天的汉字朋友</b>${d.words.map(w=>esc(w.char)).join('　')}</div><div class="note-box"><b>不着急，我们慢慢来</b>听一听 · 找一找 · 读小故事 · 收下小花</div></section>`;
 document.querySelector('#start').onclick=()=>done?go('parent'):go('lesson');
}
function renderLesson(){
 const day=currentDay(),d=course.days[day-1],step=state.positions[day],t=currentTask(),total=course.lessons[day].length;
 if(!t)return go('home');
 const type={warmup:'出发前，听一听',review:'先见见老朋友',learn:'认识新朋友',listen:'小耳朵时间',match:'词语配对',sentence:'读一个小故事',reward:'每次尝试，都值得鼓励'}[t.kind];
 let content='';
 if(t.kind==='learn')content=`<div class="learning-card"><div class="learning-picture">${SproutArt.character(t.char)}</div><div><div class="character">${esc(t.char)}</div><div class="word">${esc(t.word)}</div></div></div>`;
 else if(t.kind==='match')content=`<div class="match-prompt"><div class="character">${esc(t.char)}</div><p>看一看，哪个词语是它的朋友？</p></div>`;
 else if(t.kind==='review'||t.kind==='listen')content=`<div class="listening-mascot">${SproutArt.mascot('listen')}</div><p>小耳朵听一听，再找汉字朋友。</p>`;
 else if(t.kind==='sentence')content=`<div class="story-picture">${SproutArt.story(day,d.sentences.indexOf(t.text))}</div><p class="sentence">${esc(t.text)}</p>`;
 else if(t.kind==='reward')content=`<div class="reward-flower" aria-hidden="true">🌼</div><p class="warmup-text">${esc(t.text)}</p>`;
 else content=`<div class="listening-mascot">${SproutArt.mascot('listen')}</div><p class="warmup-text">${esc(t.text)}</p>`;
 main.innerHTML=`<section class="lesson-top"><div><span class="eyebrow">第 ${day} 天 · ${esc(d.title)}</span><h2>${type}</h2></div><button class="quiet" id="pause">先休息一下</button></section><progress class="progress" aria-label="本课进度" value="${step}" max="${total}"></progress><section class="activity"><div class="eyebrow">第 ${step+1} 小步 / ${total}</div><h1>${esc(t.title)}</h1>${content}<button class="audio" id="play">▶ 听一听</button><p class="audio-note" id="audio-note">点一下播放，可以反复听。</p>${t.options?`<div class="options">${t.options.map(o=>`<button class="option ${t.kind==='match'?'word-option':''}" data-answer="${esc(o)}" disabled>${t.kind==='match'?`<span class="option-picture">${SproutArt.word(o,t.char)}</span>`:''}<span class="option-label">${esc(o)}</span></button>`).join('')}</div>`:`<div class="actions"><button class="primary" id="advance" disabled>${t.kind==='reward'?'收下今天的小花':'我听好了，继续'}</button></div>`}<div id="feedback" role="status" aria-live="polite" tabindex="-1"></div></section>`;
 document.querySelector('#pause').onclick=()=>go('home');
 document.querySelector('#play').onclick=()=>play(t);
 document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>submit(b.dataset.answer,t));
 const next=document.querySelector('#advance');if(next)next.onclick=()=>submit(null,t);
}
function enableAnswers(){if(busy||pending||storageProblem||!heard)return;document.querySelectorAll('[data-answer],#advance').forEach(b=>b.disabled=false);}
function play(t){
 if(busy)return;stopAudio();audioTask=t;
 const b=document.querySelector('#play'),note=document.querySelector('#audio-note');if(!b)return;
 b.textContent='♫ 正在播放，再点可重听';note.textContent='听完后，就可以继续了。';
 voice.src='/audio/'+encodeURIComponent(t.audio)+'.wav';
 voice.onended=()=>{if(audioTask!==t)return;heard=true;b.textContent='↻ 再听一次';note.textContent='听到了吗？来试一试。';enableAnswers();};
 const fail=()=>{if(audioTask!==t)return;heard=false;b.textContent='↻ 重新播放';note.textContent='声音没有播放成功。请检查音量与连接，再试一次；这一步还没有完成。';document.querySelectorAll('[data-answer],#advance').forEach(x=>x.disabled=true);};
 voice.onerror=fail;voice.play().catch(fail);
}
async function submit(answer,t){
 if(busy||pending||storageProblem||!heard)return;
 const e={id:id(),day:currentDay(),step:state.positions[currentDay()],answer};
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
  if(pending){feedback=null;render();waitingNotice();}else if(feedback && location.hash==='#lesson')showFeedback();else render();
 }catch(e){
  if(e.status===400){notice('服务器进度与这条暂存记录不同，可能在另一个页面学习过。不要重复作答，请先核对。','error', [['读取服务器进度',async()=>{
   try{state=await request('/api/state');removePending(submitting);pending=null;readPending();feedback=null;clearNotice();render();if(pending)waitingNotice();}catch(err){waitingNotice();}
  }]]);}else waitingNotice();
 }finally{busy=false;}
}
function showFeedback(){
 stopAudio();const f=feedback;feedback=null;const isQuestion=Object.hasOwn(f.task,'answer');
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
 box.innerHTML=`<div class="feedback ${correct?'feedback-success':'feedback-try'}"><div class="feedback-hero"><span class="feedback-symbol" aria-hidden="true"><svg viewBox="0 0 64 64">${mark}</svg></span><div class="feedback-copy"><strong>${esc(heading)}</strong><p>${esc(extra)}</p></div><div class="feedback-mascot">${SproutArt.mascot(correct?'success':'try')}</div></div><div class="actions"><button class="primary" id="next">${f.task.kind==='reward'?'回到小花园':'下一小步'}</button></div></div>`;
 document.querySelectorAll('[data-answer],#advance,#play').forEach(button=>button.disabled=true);
 document.querySelector('#next').onclick=()=>f.task.kind==='reward'?go('home'):render();
 box.focus({preventScroll:true});box.scrollIntoView({block:'nearest',behavior:'auto'});
}
function renderGate(){
 main.innerHTML='<section class="gate"><div class="eyebrow">留给大人的一小扇窗</div><h1>家长小窗</h1><p>陪孩子看看今天的尝试。<br>这个小问题只防误触，不是安全密码。</p><form id="gate"><label for="gate-answer">3 + 4 等于几？</label><input id="gate-answer" inputmode="numeric" autocomplete="off" required><button class="primary" type="submit">进入家长小窗</button><p id="gate-note" role="status"></p></form><button class="quiet" id="home">回小花园</button></section>';
 document.querySelector('#home').onclick=()=>go('home');document.querySelector('#gate').onsubmit=async e=>{e.preventDefault();if(document.querySelector('#gate-answer').value.trim()==='7'){parentOpen=true;renderParent();await refreshState();}else document.querySelector('#gate-note').textContent='再算一算，也可以请大人帮忙。';};
}
function renderParent(){
 const cal=state.calendar;
 main.innerHTML=`<section class="dashboard-head"><div class="eyebrow">陪伴，比催促更重要</div><h1>看见每一点成长</h1><p>完成不等于掌握。这里记录的是练习表现，不是能力评测。</p><button class="quiet" id="home">回小花园</button></section><section class="metrics"><div class="metric">今天的尝试<b>${cal.today_steps} <small>小步</small></b><span class="subtle">${cal.date}</span></div><div class="metric">本周陪伴<b>${cal.week_active_days} <small>天</small></b><span class="subtle">本周共 ${cal.week_steps} 小步</span></div><div class="metric">课程小花<b>${state.rewards.length} <small>/ 7 朵</small></b><span class="subtle">每课固定 1 朵，不重复发放</span></div></section><p class="subtle">按 ${esc(cal.timezone)} 统计，周一为一周起点。课程第几天与日历日期不同，可以分段学习。没有连续签到要求。</p><div class="section-top"><h2>35 位汉字朋友</h2><span class="subtle">有答错记录的字，建议以后再见一面</span></div><section class="word-grid">${course.days.flatMap(d=>d.words).map(w=>{const s=state.stats[w.char];return `<article class="word-status ${s?.wrong?'revisit':''}"><strong>${esc(w.char)}</strong><span>${s?(s.wrong?'建议再见一面':'正在熟悉'):'还未练习'}</span><small>${s?'尝试 '+s.attempts+' 次 · 答对 '+s.correct+' 次':'还没有答题记录'}</small></article>`;}).join('')}</section><section class="note-box"><b>一起复习的小建议</b>选 2～3 个“建议再见一面”的字，在绘本或家里的物品上找一找。答对次数不代表已经掌握，第 7 天新字也建议之后在生活中再遇见。</section><section class="section-top"><h2>保存这段成长</h2></section><p>学习记录保存在家庭服务器。下载一份备份，换设备或迁移时更安心。</p><a class="backup-link" href="/api/backup" download>↓ 下载学习记录备份</a><p class="subtle">恢复需先停止服务，再按 README 操作；网页没有清空功能。仅用于可信家庭网络，不要公开到互联网。</p>`;
 document.querySelector('#home').onclick=()=>go('home');
}
document.querySelector('#parent-link').onclick=()=>go('parent');
window.addEventListener('hashchange',async()=>{feedback=null;render();await refreshCurrentView();});
window.addEventListener('focus',refreshCurrentView);
window.addEventListener('storage',e=>{if(!e.key?.startsWith(KEY)||busy)return;feedback=null;pending=null;readPending();if(storageProblem)storageNotice();else if(pending)waitingNotice();else refreshState();});
setInterval(refreshCurrentView,60000);
window.addEventListener('online',()=>pending?flush():null);
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
boot();
