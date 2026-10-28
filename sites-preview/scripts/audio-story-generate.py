#!/usr/bin/env python3
"""Generate frozen curriculum text using Microsoft Xiaoxiao MP3 only after explicit external-transfer approval."""
import asyncio, hashlib, json, pathlib, re, subprocess, unicodedata, argparse, os, ssl
BASE=pathlib.Path(__file__).resolve().parents[1]
VOICE='zh-CN-XiaoxiaoNeural'
RATE='+0%'
REPORT=BASE/'audio-story-report.json'
def norm(s): return unicodedata.normalize('NFC',s).strip()
def manifest():
 s=(BASE/'dist/audio-manifest.js').read_text()
 return json.loads(s[s.index('{'):].rstrip().rstrip(';'))
def text_inventory():
 code="const p=require('node:path');const rows=require('./scripts/verify-story-audio.cjs').inventory(p.resolve('dist'));console.log(JSON.stringify(rows.map(x=>x.text)));"
 return sorted(set(json.loads(subprocess.check_output(['node','-e',code],cwd=BASE))))
def inspect(p):
 raw=p.read_bytes()
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_packets','-show_entries','format=duration:stream=codec_name,sample_rate,channels,nb_read_packets','-of','json',str(p)],text=True))
 stream=info['streams'][0];duration=float(info['format']['duration']);packets=int(stream['nb_read_packets'])
 assert raw and stream['codec_name']=='mp3' and duration>0 and packets>0
 return {'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'duration_seconds':duration,'channels':int(stream['channels']),'sample_rate':int(stream['sample_rate']),'packets':packets,'format':'MP3'}
def configured_tls_context():
 # Honor the environment's existing CA bundle; never disable peer/hostname checks.
 context=ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))
 assert context.verify_mode==ssl.CERT_REQUIRED and context.check_hostname
 return context
async def main():
 args=argparse.ArgumentParser();args.add_argument('--limit',type=int);args.add_argument('--verify-all',action='store_true');args.add_argument('--audit-existing',action='store_true');a=args.parse_args()
 m=manifest();texts=text_inventory(); records=[];count=0
 if a.verify_all or a.audit_existing:
  for text,rel in m['clips'].items():
   expected='audio/'+hashlib.sha256(norm(text).encode()).hexdigest()+'.mp3'
   assert rel==expected,('bad-text-hash',text)
   records.append({'text':text,'file':rel,**inspect(BASE/'dist'/rel)})
  missing=[t for t in texts if t not in m['clips']]
  if a.verify_all: assert not missing,missing
  report={'voice':VOICE,'rate':RATE,'clips':len(records),'new_curriculum_texts':len(texts),'complete':not missing,'missing_count':len(missing),'missing':missing,'art_included':(BASE/'dist/story-art.js').exists(),'listening_verified':False,'validation':'All existing text SHA256 paths, actual file SHA256, MP3 format, nonzero duration and packet count verified with ffprobe. No listening-quality claim.','files':records}
  REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
  print(json.dumps({k:v for k,v in report.items() if k not in ['files','missing']},ensure_ascii=False));return
 for text in texts:
  rel='audio/'+hashlib.sha256(text.encode()).hexdigest()+'.mp3';p=BASE/'dist'/rel
  if not p.exists():
   if a.limit is not None and count>=a.limit: break
   tmp=p.with_suffix('.partial');error=None
   # Fail closed on the first request error. No transport or provider fallback.
   import edge_tts
   if os.environ.get('SSL_CERT_FILE'):
    edge_tts.communicate._SSL_CTX=configured_tls_context()
   try:
    await asyncio.wait_for(edge_tts.Communicate(text=text,voice=VOICE,rate=RATE).save(str(tmp)),timeout=60)
    inspect(tmp);tmp.replace(p)
   except Exception as e:
    tmp.unlink(missing_ok=True)
    print(json.dumps({'error':type(e).__name__,'http_status':getattr(e,'status',None),'generated_before_failure':count},ensure_ascii=False),flush=True)
    raise
   count+=1
   print(json.dumps({'generated':count,'text':text,'file':rel},ensure_ascii=False),flush=True)
  inspect(p);m['clips'][text]=rel
  manifest_tmp=BASE/'dist/audio-manifest.js.partial'
  manifest_tmp.write_text('/* Pre-generated curriculum audio only. */\nglobalThis.SproutAudioManifest='+json.dumps(m,ensure_ascii=False,indent=2)+';\n')
  manifest_tmp.replace(BASE/'dist/audio-manifest.js')
 print(json.dumps({'generated_now':count,'inventory':len(texts),'registered':len(m['clips']),'art_included':(BASE/'dist/story-art.js').exists()},ensure_ascii=False))
if __name__=='__main__':asyncio.run(main())
