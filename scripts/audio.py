"""Verify bundled WAV files; explicit --generate requires macOS Tingting (family test only)."""
import argparse,sys,subprocess,json,wave,hashlib
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from course import audio_texts

def validate_cached(path,key,text,previous):
    item=previous.get(key,{})
    return path.is_file() and item.get('text')==text and item.get('sha256')==hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--generate',action='store_true',help='Regenerate missing/changed clips on macOS only')
    args=parser.parse_args()
    root=Path(__file__).resolve().parents[1]/'static/audio'
    previous=json.loads((root/'manifest.json').read_text()) if (root/'manifest.json').exists() else {}
    manifest={}
    for key,text in audio_texts().items():
        out=root/(key+'.wav')
        if not validate_cached(out,key,text,previous):
            if not args.generate:raise SystemExit(f'音频缺失、内容已变更或校验失败：{key}。未覆盖 manifest；请重新生成对应音频。')
            if sys.platform!='darwin':raise SystemExit('生成脚本仅支持 macOS；本次未生成音频。')
            subprocess.run(['say','-v','Tingting','-r','145','-o',str(out),'--file-format=WAVE','--data-format=LEI16@22050',text],check=True)
        with wave.open(str(out)) as w:
            duration=w.getnframes()/w.getframerate()
            if duration<=.2 or w.getcomptype()!='NONE' or w.getnchannels()!=1 or w.getsampwidth()!=2:raise SystemExit(f'无效 PCM WAV：{key}')
        manifest[key]=dict(text=text,seconds=round(duration,2),sha256=hashlib.sha256(out.read_bytes()).hexdigest())
    if args.generate:
        temp=root/'manifest.json.tmp';temp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2));temp.replace(root/'manifest.json')
    print(f'Validated {len(manifest)} PCM WAV assets; speech pronunciation not verified by this check.')
if __name__=='__main__':main()
