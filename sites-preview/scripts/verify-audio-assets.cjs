'use strict';
// Usage: node scripts/verify-audio-assets.cjs [--assets] [--write-integrity FILE]
// Optional --expected-integrity FILE compares audio byte hashes from an earlier
// verified transfer. Text-only checks deliberately do not claim audio exists.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm'),assert=require('node:assert/strict');
const normalize=s=>String(s).normalize('NFC').trim();
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
function isMp3(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length<128)return false;
 let offset=0;
 if(bytes.subarray(0,3).toString()==='ID3'){
  if(bytes.length<10||![2,3,4].includes(bytes[3])||[6,7,8,9].some(i=>bytes[i]&128))return false;
  offset=10+((bytes[6]<<21)|(bytes[7]<<14)|(bytes[8]<<7)|bytes[9]);
  if(bytes[3]===4&&(bytes[5]&16))offset+=10;
 }
 for(let i=offset;i<Math.min(bytes.length-3,offset+4096);i++){
  if(bytes[i]!==255||(bytes[i+1]&224)!==224)continue;
  const version=(bytes[i+1]>>3)&3,layer=(bytes[i+1]>>1)&3,bitrate=bytes[i+2]>>4,sample=(bytes[i+2]>>2)&3;
  if(version!==1&&layer!==0&&bitrate>0&&bitrate<15&&sample!==3)return true;
 }
 return false;
}
function verify({dist=path.resolve(__dirname,'../dist'),assets=false,expectedIntegrity=null}={}){
 const read=n=>fs.readFileSync(path.join(dist,n),'utf8'),app=read('app.js'),speech=read('speech.js'),catalog=JSON.parse(read('course.json'));
 const ctx={};vm.createContext(ctx);vm.runInContext(read('audio-manifest.js'),ctx);vm.runInContext(speech,ctx);
 const manifest=ctx.SproutAudioManifest;assert.equal(manifest.voice,'zh-CN-XiaoxiaoNeural');assert.ok(manifest.clips&&typeof manifest.clips==='object');
 const start=app.indexOf('function showFeedback(){'),end=app.indexOf('\nfunction renderGate()',start);
 assert.ok(start>=0&&end>start,'Cannot locate actual feedback renderer');
 const feedbackCode=app.slice(start,end),texts=new Set();let prompts=0,feedbackVariants=0;
 function feedback(course,day,task,answer){
  const spoken=[],element={innerHTML:'',focus(){},scrollIntoView(){}};
  const sandbox={learningMode:'audio',feedback:{task,answer},stopAudio(){},course,currentDay:()=>day.day,
   document:{querySelector:()=>element,querySelectorAll:()=>[]},esc:s=>String(s),SproutArt:{mascot:()=>''},
   SproutSpeech:{...ctx.SproutSpeech,speak:text=>spoken.push(text)},render(){},go(){}};
  vm.createContext(sandbox);vm.runInContext(feedbackCode+'\nshowFeedback();',sandbox);
  assert.equal(spoken.length,1,'Expected one actual feedback utterance');return spoken[0];
 }
 for(const course of catalog.courses)for(const day of course.days)for(const task of course.lessons[day.day]){
  texts.add(normalize(ctx.SproutSpeech.taskText(task,task.kind==='comprehension'?day.sentences[0]:'')));prompts++;
  for(const answer of task.options||[null]){texts.add(normalize(feedback(course,day,task,answer)));feedbackVariants++;}
 }
 const storyTexts=fs.existsSync(path.join(dist,'story-course.json'))?new Set(require('./verify-story-audio.cjs').inventory(dist).map(row=>row.text)):new Set();
 const missing=[...texts].filter(t=>!Object.hasOwn(manifest.clips,t)),unused=Object.keys(manifest.clips).filter(t=>!texts.has(t)&&!storyTexts.has(t));
 for(const text of storyTexts)if(Object.hasOwn(manifest.clips,text))assert.equal(manifest.clips[text],'audio/'+sha(text)+'.mp3','New-story audio filename must match text SHA-256');
 assert.equal(missing.length,0,'Missing spoken texts from audio manifest');assert.equal(unused.length,0,'Stale audio manifest entries');
 const files=[],expected=expectedIntegrity?new Map(expectedIntegrity.files.map(f=>[f.path,f])):null;
 for(const text of texts){
  assert.ok(text.length>0);const src=manifest.clips[text];assert.equal(src,'audio/'+sha(text)+'.mp3','Audio filename must match normalized text SHA-256');
  if(!assets)continue;
  const file=path.join(dist,src),stat=fs.lstatSync(file);assert.ok(stat.isFile()&&!stat.isSymbolicLink(),'Audio asset must be a regular file');
  const bytes=fs.readFileSync(file);assert.ok(isMp3(bytes),'Invalid or empty MP3: '+src);
  const row={path:src,bytes:bytes.length,sha256:sha(bytes)};files.push(row);
  if(expected){const previous=expected.get(src);assert.ok(previous,'No expected byte hash for '+src);assert.equal(row.bytes,previous.bytes,'Byte count mismatch: '+src);assert.equal(row.sha256,previous.sha256,'Audio hash mismatch: '+src);}
 }
 if(assets&&expected)assert.equal(expected.size,files.length,'Unexpected files in integrity reference');
 return {summary:{mode:assets?'text-and-assets':'text-only',voice:manifest.voice,prompt_uses:prompts,feedback_variants:feedbackVariants,unique_clips:texts.size,missing_texts:0,unused_clips:0,files_validated:files.length,total_audio_bytes:files.reduce((n,f)=>n+f.bytes,0)},integrity:{schema_version:1,voice:manifest.voice,files:files.sort((a,b)=>a.path.localeCompare(b.path))}};
}
module.exports={verify,isMp3};
if(require.main===module){
 try{
  const args=process.argv.slice(2),allowed=new Set(['--assets','--write-integrity','--expected-integrity']);
  let assets=false,write=null,expected=null;
  for(let i=0;i<args.length;i++){assert.ok(allowed.has(args[i]),'Unknown argument');if(args[i]==='--assets')assets=true;else{assert.ok(args[i+1]&&!args[i+1].startsWith('--'),'Expected a file argument');if(args[i]==='--write-integrity')write=args[++i];else expected=args[++i];}}
  assert.ok((!write&&!expected)||assets,'Integrity options require --assets');
  const result=verify({assets,expectedIntegrity:expected?JSON.parse(fs.readFileSync(expected,'utf8')):null});
  if(write)fs.writeFileSync(write,JSON.stringify(result.integrity,null,2)+'\n');
  console.log(JSON.stringify(result.summary));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
