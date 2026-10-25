"""Anonymous synthetic fixtures; no real learner records."""
import json, sqlite3
from course import DAYS, VERSION, lesson

def legacy_database(path, steps=1):
    with sqlite3.connect(path) as db:
        db.executescript('''CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,payload TEXT NOT NULL,day INTEGER,step INTEGER,answer TEXT,correct INTEGER,character TEXT,created REAL,UNIQUE(day,step));
   CREATE TABLE IF NOT EXISTS rewards(day INTEGER PRIMARY KEY,created REAL);''')
        db.executemany('INSERT INTO meta VALUES (?,?)',[('version',VERSION),('course',json.dumps(DAYS,ensure_ascii=False))])
        for i,t in enumerate(lesson(1)[:steps]):
            e=dict(id=f'legacy-event-{i}',day=1,step=i,answer=t.get('answer'))
            db.execute('INSERT INTO events VALUES (?,?,?,?,?,?,?,?)',(e['id'],json.dumps(e,sort_keys=True,ensure_ascii=False),1,i,e['answer'],int(e['answer']==t['answer']) if 'answer' in t else None,t.get('char'),1709164740.0))
        if steps==len(lesson(1)): db.execute('INSERT INTO rewards VALUES (1,1709164740.0)')

def event(store,step=0,day=1,version='sprout-3',run='main',stamp='2024-02-28T23:59:00+00:00',mode='adult',event_id=None,answer=None):
    from curriculum import get_course, tasks_for
    return dict(id=event_id or f'{version}-{day}-{run}-{step}',course_version=version,
                lesson_id=get_course(version)['days'][day-1]['id'],run_id=run,step=step,
                answer=answer if answer is not None else tasks_for(version,day)[step].get('answer'),
                mode=mode,occurred_at=stamp,client_timezone='UTC',generation=store.state()['generation'])
