import sqlite3,json,time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from pathlib import Path
from course import DAYS,VERSION,lesson
class Store:
 def __init__(self,path):
  self.path=Path(path);self.path.parent.mkdir(parents=True,exist_ok=True)
  with self.connect() as db:
   db.executescript('''CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,payload TEXT NOT NULL,day INTEGER,step INTEGER,answer TEXT,correct INTEGER,character TEXT,created REAL,UNIQUE(day,step));
   CREATE TABLE IF NOT EXISTS rewards(day INTEGER PRIMARY KEY,created REAL);''')
   row=db.execute("SELECT value FROM meta WHERE key='version'").fetchone()
   if row and row[0]!=VERSION:raise ValueError('课程版本不匹配')
   db.execute('INSERT OR IGNORE INTO meta VALUES (?,?)',('version',VERSION))
   db.execute('INSERT OR IGNORE INTO meta VALUES (?,?)',('course',json.dumps(DAYS,ensure_ascii=False)))
 def connect(self):
  db=sqlite3.connect(self.path,timeout=10);db.execute('PRAGMA foreign_keys=ON');return db
 def state(self,now=None,timezone="Asia/Shanghai"):
  with self.connect() as db:
   db.execute("BEGIN")
   pos={str(d):db.execute('SELECT COUNT(*) FROM events WHERE day=?',(d,)).fetchone()[0] for d in range(1,8)}
   stats={r[0]:dict(attempts=r[1],correct=r[2],wrong=r[1]-r[2]) for r in db.execute('SELECT character,COUNT(*),SUM(correct) FROM events WHERE correct IS NOT NULL GROUP BY character')}
   rewards=[r[0] for r in db.execute('SELECT day FROM rewards ORDER BY day')]
   current=datetime.fromtimestamp(time.time() if now is None else now,ZoneInfo(timezone))
   today=current.date();week=today-timedelta(days=today.weekday())
   dates=[datetime.fromtimestamp(r[0],ZoneInfo(timezone)).date() for r in db.execute('SELECT created FROM events')]
   calendar=dict(timezone=timezone,date=str(today),week_start=str(week),today_steps=sum(d==today for d in dates),week_steps=sum(week<=d<=today for d in dates),week_active_days=len({d for d in dates if week<=d<=today}))
   return dict(version=VERSION,positions=pos,stats=stats,rewards=rewards,calendar=calendar)
 def submit(self,e):
  if not isinstance(e,dict) or set(e)!={'id','day','step','answer'} or not isinstance(e['id'],str) or not 8<=len(e['id'])<=80:raise ValueError('无效记录')
  day=e['day'];step=e['step'];tasks=lesson(day)
  if type(step)!=int or not 0<=step<len(tasks):raise ValueError('无效步骤')
  t=tasks[step];answer=e['answer']
  if (t.get('options') and answer not in t['options']) or (not t.get('options') and answer is not None):raise ValueError('无效答案')
  payload=json.dumps(e,sort_keys=True,ensure_ascii=False)
  with self.connect() as db:
   db.execute('BEGIN IMMEDIATE')
   old=db.execute('SELECT payload FROM events WHERE id=?',(e['id'],)).fetchone()
   if old:
    if old[0]!=payload:raise ValueError('重复标识的内容不同')
   else:
    if day>1 and not db.execute('SELECT 1 FROM rewards WHERE day=?',(day-1,)).fetchone():raise ValueError('先完成前一天')
    count=db.execute('SELECT COUNT(*) FROM events WHERE day=?',(day,)).fetchone()[0]
    if count!=step:raise ValueError('进度已改变，请刷新')
    correct=int(answer==t['answer']) if 'answer' in t else None
    db.execute('INSERT INTO events VALUES (?,?,?,?,?,?,?,?)',(e['id'],payload,day,step,answer,correct,t.get('char'),time.time()))
    if step==len(tasks)-1:db.execute('INSERT OR IGNORE INTO rewards VALUES (?,?)',(day,time.time()))
  return self.state()
 def backup(self,path):
  with self.connect() as src,sqlite3.connect(path) as dst:src.backup(dst)
