'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{spawnSync}=require('node:child_process');
const script=path.join(__dirname,'../scripts/verify-audio-assets.cjs');
test('published speech and every possible feedback have an exact static audio manifest entry',()=>{
 const result=spawnSync(process.execPath,[script],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr||result.stdout);
 const report=JSON.parse(result.stdout);assert.equal(report.mode,'text-only');assert.equal(report.missing_texts,0);assert.equal(report.unused_clips,0);assert.ok(report.unique_clips>0);assert.ok(report.feedback_variants>=report.prompt_uses);
});
test('audio byte validator rejects empty and non-MP3 content instead of treating a filename as proof',()=>{
 const {isMp3}=require(script);
 assert.equal(isMp3(Buffer.alloc(0)),false);assert.equal(isMp3(Buffer.from('<html>error</html>'.repeat(20))),false);
 const mp3=Buffer.alloc(256);mp3[0]=0xff;mp3[1]=0xfb;mp3[2]=0x90;mp3[3]=0x64;assert.equal(isMp3(mp3),true);
 const id3=Buffer.alloc(256);id3.write('ID3',0);id3[3]=4;id3[10]=0xff;id3[11]=0xfb;id3[12]=0x90;id3[13]=0x64;assert.equal(isMp3(id3),true);
 const tagOnly=Buffer.alloc(256);tagOnly.write('ID3',0);tagOnly[3]=4;assert.equal(isMp3(tagOnly),false);
});
