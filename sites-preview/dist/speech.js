/* Pre-generated same-origin Xiaoxiao MP3 only. No browser TTS or runtime synthesis. */
'use strict';
(function(root){
 let serial=0,current=null,timer=null;
 const normalize=text=>String(text).normalize('NFC').trim();
 function release(audio){if(!audio)return;audio.onplaying=audio.onended=audio.onerror=audio.onabort=null;try{audio.pause();audio.removeAttribute('src');audio.load();}catch(_){}}
 function cancel(){serial++;if(timer!==null){clearTimeout(timer);timer=null;}const old=current;current=null;release(old);}
 function status(){return root.SproutAudioManifest?.voice==='zh-CN-XiaoxiaoNeural'?'晓晓 · 普通话录音':'语音资源未加载，请刷新页面后重试。';}
 const spokenContexts=Object.freeze({'了':'来了','只':'一只小鸟','和':'我和你','的':'我的','好':'好书'});
 function spokenTarget(t){const context=t.pronunciation_context||spokenContexts[t.char];return context?context+'的'+t.char:t.char;}
 function feedbackText(heading,extra){return (heading+'。'+extra).replace(/「([了只和的好])」/g,(_,char)=>'「'+spokenContexts[char]+'的'+char+'」');}
 function taskText(t,storyText=''){
  if(t.kind==='warmup')return '小朋友，欢迎来到汉字小花园。听一听，读一读，再试一试。准备好了，就点继续。';
  if(t.kind==='learn')return '跟我读。'+spokenTarget(t)+'。'+t.word+'。';
  if(t.kind==='listen'||t.kind==='review')return '听一听，找到这个汉字。'+spokenTarget(t)+'。'+spokenTarget(t)+'。';
  if(t.kind==='match')return '给汉字找词语朋友。'+spokenTarget(t)+'。下面有：'+t.options.join('，')+'。请选择。';
  if(t.kind==='sentence')return t.text+'。听完后，你也试着读一读。';
  if(t.kind==='comprehension'&&storyText)return '看图，听故事。'+storyText+'。现在想一想：'+t.text+'。选项是：'+t.options.join('，')+'。请选择。';
  if(t.options)return (t.text||t.adult_prompt||t.title)+'。选项是：'+t.options.join('，')+'。请选择。';
  return t.text||t.adult_prompt||t.char||t.title||'';
 }
 function speak(text,handlers={}){
  cancel();const token=serial,key=normalize(text);let started=false,settled=false,audio=null;
  const finish=(ok,reason)=>{if(token!==serial||settled)return;settled=true;if(timer!==null)clearTimeout(timer);timer=null;if(current===audio)current=null;release(audio);if(ok)handlers.end?.();else handlers.error?.(reason||'播放未完成');};
  const manifest=root.SproutAudioManifest,src=manifest?.clips?.[key];
  if(manifest?.voice!=='zh-CN-XiaoxiaoNeural'||typeof src!=='string'||!/^audio\/[a-f0-9]{64}\.mp3$/.test(src)){finish(false,'这段录音暂时不可用，请刷新后重试；不会改用系统语音。');return;}
  if(typeof root.Audio!=='function'){finish(false,'当前浏览器不支持音频播放，请换用 Safari 或 Chrome。');return;}
  const playbackError=e=>finish(false,e?.name==='NotAllowedError'?'请亲自点一下朗读按钮，允许本页播放声音。':'录音没有播放完成，请检查网络和音量后重试。');
  try{
   audio=new root.Audio('/'+src);current=audio;audio.preload='auto';audio.volume=1;
   audio.onplaying=()=>{if(token!==serial||settled||started)return;started=true;handlers.start?.('晓晓 · 普通话录音');};
   audio.onended=()=>finish(started,started?null:'录音未实际开始，请点“再听一次”重试。');
   audio.onerror=()=>playbackError();audio.onabort=()=>playbackError();
   timer=setTimeout(()=>finish(false,'录音播放超时，请点“再听一次”重试。'),Math.max(20000,Math.min(180000,key.length*700+10000)));
   // The manifest is already loaded. Call play synchronously in this gesture;
   // no network lookup or digest promise may consume mobile autoplay permission.
   const playing=audio.play();if(playing&&typeof playing.catch==='function')playing.catch(playbackError);
  }catch(e){playbackError(e);}
 }
 root.SproutSpeech={cancel,speak,taskText,status,normalize,feedbackText};
})(globalThis);
