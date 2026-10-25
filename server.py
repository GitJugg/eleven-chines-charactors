"""Trusted home-LAN service. Never expose this unauthenticated app to the internet."""
import argparse
import json
import mimetypes
import os
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
from course import DAYS, VERSION, lesson
from store import Store
from data_lock import DataLock

ROOT=Path(__file__).resolve().parent

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # No IP/user-agent/request logging or third-party telemetry.

    def send(self, status, body, content_type='application/json; charset=utf-8', extra=None):
        if not isinstance(body, bytes):
            body=json.dumps(body,ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        for k,v in {'Content-Type':content_type,'Content-Length':str(len(body)),
                    'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
                    'Referrer-Policy':'no-referrer',
                    'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'",**(extra or {})}.items():
            self.send_header(k,v)
        self.end_headers()
        try:self.wfile.write(body)
        except (BrokenPipeError,ConnectionResetError):pass

    def do_GET(self):
        path=unquote(urlsplit(self.path).path)
        try:
            if path=='/api/state':return self.send(200,self.server.store.state(timezone=self.server.timezone))
            if path=='/api/course':return self.send(200,dict(version=VERSION,days=DAYS,lessons={str(d):lesson(d) for d in range(1,8)}))
            if path=='/api/backup':
                with tempfile.TemporaryDirectory() as tmp:
                    file=Path(tmp)/'backup.sqlite3';self.server.store.backup(file)
                    return self.send(200,file.read_bytes(),'application/vnd.sqlite3',{'Content-Disposition':'attachment; filename="sprout-backup.sqlite3"'})
            if path=='/api/health':return self.send(200,{'ok':True})
            relative='index.html' if path=='/' else path.lstrip('/')
            file=(ROOT/'static'/relative).resolve()
            if not file.is_relative_to((ROOT/'static').resolve()) or not file.is_file():
                return self.send(404,{'error':'没有找到这个页面'})
            return self.send(200,file.read_bytes(),mimetypes.guess_type(file)[0] or 'application/octet-stream')
        except Exception:
            return self.send(500,{'error':'读取失败，请稍后重试；没有清除学习记录'})

    def do_POST(self):
        if self.path!='/api/event':return self.send(404,{'error':'没有这个接口'})
        origin=self.headers.get('Origin')
        if origin and origin not in ('http://'+self.headers.get('Host',''),'https://'+self.headers.get('Host','')):
            return self.send(403,{'error':'不允许来自其他网站的提交'})
        if self.headers.get('Sec-Fetch-Site')=='cross-site':return self.send(403,{'error':'不允许跨站提交'})
        if self.headers.get('Content-Type','').split(';')[0].strip()!='application/json':
            return self.send(415,{'error':'请使用 JSON 提交'})
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<=4096:raise ValueError('记录大小不正确')
            event=json.loads(self.rfile.read(length))
            self.server.store.submit(event)
            return self.send(200,self.server.store.state(timezone=self.server.timezone))
        except (ValueError,TypeError,KeyError):
            return self.send(400,{'error':'记录无效或进度已改变，请核对服务器进度'})
        except Exception:
            return self.send(503,{'error':'暂未保存，请保留本页并重试'})

    def setup(self):
        super().setup();self.connection.settimeout(15)

class LockedServer(ThreadingHTTPServer):
    def server_close(self):
        super().server_close()
        if hasattr(self,'data_lock'):self.data_lock.close()

def make_server(host,port,database,timezone='Asia/Shanghai'):
    from zoneinfo import ZoneInfo
    ZoneInfo(timezone)
    lock=DataLock(database)
    try:
        store=Store(database)
        server=LockedServer((host,port),Handler)
    except Exception:
        lock.close();raise
    server.data_lock=lock;server.store=store;server.timezone=timezone
    return server

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--host',default=os.environ.get('HOST','127.0.0.1'))
    parser.add_argument('--port',type=int,default=int(os.environ.get('PORT','8080')))
    args=parser.parse_args()
    data=Path(os.environ.get('DATA_DIR',ROOT/'data'))
    server=make_server(args.host,args.port,data/'progress.sqlite3',os.environ.get('APP_TIMEZONE','Asia/Shanghai'))
    print(f'小芽识字屋：http://{args.host}:{args.port}（仅供可信家庭网络）',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
if __name__=='__main__':main()
