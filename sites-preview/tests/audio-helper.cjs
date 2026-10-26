// Only the browser media boundary is simulated. UI tests use the real player.
const {createHash}=require('node:crypto');
module.exports=function audioEnvironment(spoken){
 const texts=new Map();
 const clips=new Proxy({}, {get(_target,text){if(typeof text!=='string')return;const path='audio/'+createHash('sha256').update(text).digest('hex')+'.mp3';texts.set('/'+path,text);return path;}});
 return {SproutAudioManifest:{voice:'zh-CN-XiaoxiaoNeural',clips},Audio:function(src){this.src=src;this.text=texts.get(src);this.paused=true;this.pause=()=>{this.paused=true};this.removeAttribute=()=>{};this.load=()=>{};this.play=()=>{this.paused=false;const playing=this.onplaying,ended=this.onended;this.onstart=()=>playing?.();this.onend=()=>ended?.();spoken.push(this);return Promise.resolve();};}};
};
