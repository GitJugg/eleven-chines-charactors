/* Device speech only. Sends no learning records or private text to a TTS service. */
'use strict';
(function(root){
 let serial=0,current=null,timer=null;
 function cancel(){serial++;if(timer!==null){clearTimeout(timer);timer=null;}current=null;root.speechSynthesis?.cancel();}
 function voices(){return (root.speechSynthesis?.getVoices()||[]).filter(v=>/^zh(?:-|_)?(?:CN|TW|SG|Hans|Hant)?$/i.test(v.lang)||/^cmn(?:-|$)/i.test(v.lang));}
 function selected(){return voices().sort((a,b)=>(Number(/^zh[-_]CN$/i.test(b.lang))*4+Number(b.localService)*2)-(Number(/^zh[-_]CN$/i.test(a.lang))*4+Number(a.localService)*2))[0]||null;}
 function status(){const v=selected();return !root.speechSynthesis||!root.SpeechSynthesisUtterance?'此浏览器不支持朗读':v?'设备语音：'+v.name+' · '+v.lang: '正在等待设备中文语音；若无法播放，请检查系统中文语音。';}
 function taskText(t,storyText=''){
  if(t.kind==='warmup')return '小朋友，欢迎来到汉字小花园。听一听，读一读，再试一试。准备好了，就点继续。';
  if(t.pronunciation_context&&t.kind==='learn')return '跟我读。'+t.pronunciation_context+'。'+t.word+'。';
  if(t.pronunciation_context&&(t.kind==='listen'||t.kind==='review'))return '听一听，找到这个汉字。'+t.pronunciation_context+'的'+t.char+'。'+t.pronunciation_context+'的'+t.char+'。';
  if(t.kind==='learn')return '跟我读。'+t.char+'。'+t.word+'。';
  if(t.kind==='listen'||t.kind==='review')return '听一听，找到这个汉字。'+t.char+'。'+t.char+'。';
  if(t.kind==='match')return '给汉字找词语朋友。'+t.char+'。下面有：'+t.options.join('，')+'。请选择。';
  if(t.kind==='sentence')return t.text+'。听完后，你也试着读一读。';
  if(t.kind==='comprehension'&&storyText)return '看图，听故事。'+storyText+'。现在想一想：'+t.text+'。选项是：'+t.options.join('，')+'。请选择。';
  if(t.options)return (t.text||t.adult_prompt||t.title)+'。选项是：'+t.options.join('，')+'。请选择。';
  return t.text||t.adult_prompt||t.char||t.title||'';
 }
 function speak(text,handlers={}){
  cancel();const token=serial;let started=false,settled=false;
  const finish=(ok,reason)=>{if(token!==serial||settled)return;settled=true;if(timer!==null)clearTimeout(timer);timer=null;current=null;if(ok)handlers.end?.();else handlers.error?.(reason||'播放未完成');};
  if(!root.speechSynthesis||!root.SpeechSynthesisUtterance){finish(false,'当前浏览器不支持朗读，请使用 Safari 或 Chrome 并启用中文语音。');return;}
  const available=root.speechSynthesis.getVoices(),v=selected();
  // An empty initial list is common on mobile. Ask the engine for zh-CN directly
  // in this gesture; never substitute a known English/Cantonese voice.
  if(available.length&&!v){finish(false,'设备没有可用普通话语音，请在系统语音设置中添加中文普通话后重试。');return;}
  const u=new root.SpeechSynthesisUtterance(String(text));current=u;u.lang=v?.lang||'zh-CN';if(v)u.voice=v;u.rate=0.85;u.pitch=1;u.volume=1;
  u.onstart=()=>{if(token!==serial||settled)return;started=true;handlers.start?.(v? v.name+' · '+v.lang:'系统默认普通话');};
  u.onend=()=>finish(started,started?null:'声音未实际开始，请点“再听一次”重试。');
  u.onerror=e=>finish(false,e?.error==='not-allowed'?'请亲自点一下朗读按钮，允许本页播放声音。':'语音没有播放完成，请检查音量、中文语音和网络后重试。');
  timer=setTimeout(()=>{finish(false,'朗读未完成，请点“再听一次”重试。');root.speechSynthesis.cancel();},Math.max(15000,Math.min(90000,String(text).length*700)));
  try{root.speechSynthesis.speak(u);}catch(e){finish(false,'朗读启动失败，请点“再听一次”重试。');}
 }
 root.SproutSpeech={cancel,speak,taskText,status};
})(globalThis);
