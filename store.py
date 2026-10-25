"""Versioned, append-only learning facts; completion is never mastery evidence."""
import calendar as monthlib
import json
import math
import os
import re
import sqlite3
import tempfile
import time
import uuid
from contextlib import nullcontext
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from course import DAYS, VERSION, lesson
from curriculum import COURSES, get_course, tasks_for
from data_lock import DataLock

SCHEMA_VERSION=3
DDL='''CREATE TABLE meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE events(id TEXT PRIMARY KEY,payload TEXT NOT NULL,day INTEGER,step INTEGER,answer TEXT,correct INTEGER,character TEXT,created REAL,
course_version TEXT NOT NULL,lesson_id TEXT NOT NULL,run_id TEXT NOT NULL,kind TEXT NOT NULL,task_id TEXT NOT NULL,mode TEXT NOT NULL,
occurred_at REAL,activity_date TEXT NOT NULL,activity_timezone TEXT NOT NULL,time_basis TEXT NOT NULL,
UNIQUE(course_version,lesson_id,run_id,step));
CREATE TABLE rewards(course_version TEXT NOT NULL,day INTEGER NOT NULL,created REAL NOT NULL,PRIMARY KEY(course_version,day));
CREATE INDEX events_date_course ON events(activity_date,course_version);'''
LEGACY_DDL='''CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,payload TEXT NOT NULL,day INTEGER,step INTEGER,answer TEXT,correct INTEGER,character TEXT,created REAL,UNIQUE(day,step));
CREATE TABLE IF NOT EXISTS rewards(day INTEGER PRIMARY KEY,created REAL);'''
DEFAULT_SETTINGS=dict(target_characters=3000,target_date=None,daily_new_target=5,reference_minutes=20)
LEGACY_KEYS={'id','day','step','answer'}
NEW_KEYS={'id','course_version','lesson_id','run_id','step','answer','mode','occurred_at','client_timezone','generation'}

def dumps(value): return json.dumps(value,sort_keys=True,ensure_ascii=False)

def snapshots():
    return {c['version']:dict(course=c,tasks={str(d['day']):tasks_for(c['version'],d['day']) for d in c['days']}) for c in COURSES}

def valid_settings(values):
    if not isinstance(values,dict) or set(values)-set(DEFAULT_SETTINGS): raise ValueError('无效配置')
    result=dict(DEFAULT_SETTINGS,**values)
    for key,maximum in [('target_characters',3000),('daily_new_target',20),('reference_minutes',60)]:
        if type(result[key])!=int or not 1<=result[key]<=maximum: raise ValueError('配置范围不正确')
    if result['target_date'] is not None:
        if not isinstance(result['target_date'],str) or not re.fullmatch(r'[0-9]{4}-[0-9]{2}-[0-9]{2}',result['target_date']): raise ValueError('目标日期不正确')
        date.fromisoformat(result['target_date'])
    return result

def event_task(e):
    if not isinstance(e,dict) or not isinstance(e.get('id'),str) or not 8<=len(e['id'])<=100: raise ValueError('无效记录')
    legacy=set(e)==LEGACY_KEYS
    if legacy:
        version=VERSION;day=e['day'];run='main';mode='legacy_unknown'
    else:
        if set(e)!=NEW_KEYS: raise ValueError('记录字段不完整')
        version=e['course_version'];run=e['run_id'];mode=e['mode']
        course=get_course(version)
        found=[d['day'] for d in course['days'] if d['id']==e['lesson_id']]
        if not found or not isinstance(run,str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,80}',run): raise ValueError('课程或练习实例无效')
        day=found[0]
        if mode not in ('adult','silent','audio'): raise ValueError('无效学习方式')
        if not isinstance(e['generation'],str): raise ValueError('无效恢复代次')
    tasks=tasks_for(version,day);step=e['step']
    if type(step)!=int or not 0<=step<len(tasks): raise ValueError('无效步骤')
    task=tasks[step];answer=e['answer']
    if (task.get('options') and answer not in task['options']) or (not task.get('options') and answer is not None): raise ValueError('无效答案')
    return version,day,get_course(version)['days'][day-1]['id'],run,mode,task,legacy

def event_time(e,received,timezone):
    occurred=None; basis='legacy_saved' if set(e)==LEGACY_KEYS else 'invalid_client_saved'
    if set(e)==NEW_KEYS:
        try:
            ZoneInfo(e['client_timezone'])
            dt=datetime.fromisoformat(e['occurred_at'].replace('Z','+00:00'))
            candidate=dt.timestamp()
            if (dt.tzinfo is not None and math.isfinite(candidate) and 946684800<=candidate<=received+300
                    and datetime.fromtimestamp(candidate,ZoneInfo(timezone)).date()<=datetime.fromtimestamp(received,ZoneInfo(timezone)).date()):
                occurred=candidate;basis='client_reported'
        except (TypeError,ValueError,AttributeError,ZoneInfoNotFoundError): pass
    stamp=received if occurred is None else occurred
    return occurred,datetime.fromtimestamp(stamp,ZoneInfo(timezone)).date().isoformat(),timezone,basis

def row_values(e,received,timezone):
    version,day,lesson_id,run,mode,task,_=event_task(e)
    correct=int(e['answer']==task['answer']) if 'answer' in task else None
    return (e['id'],dumps(e),day,e['step'],e['answer'],correct,task.get('char'),received,
            version,lesson_id,run,task['kind'],task['task_id'],mode,*event_time(e,received,timezone))

def schema_rows(db):
    return db.execute("SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name").fetchall()

def check_schema(db,ddl):
    with sqlite3.connect(':memory:') as ref:
        ref.executescript(ddl)
        if schema_rows(db)!=schema_rows(ref): raise ValueError('数据库结构不匹配')

def valid_stamp(stamp):
    return type(stamp) in (int,float) and math.isfinite(stamp) and 0<stamp<=time.time()+86400

def validate_database(path):
    """Read every event in insertion order, with bounded auxiliary progression state.

    No record-count ceiling. Reject unknown schema, triggers, tampered derived data,
    nonsequential progression and invented rewards. Does not mutate the input.
    """
    try:
        with sqlite3.connect(Path(path).resolve().as_uri()+'?mode=ro',uri=True) as db:
            if db.execute('PRAGMA integrity_check').fetchone()!=('ok',): raise ValueError('数据库完整性检查失败')
            meta=dict(db.execute('SELECT key,value FROM meta'))
            legacy='schema_version' not in meta
            if legacy:
                check_schema(db,LEGACY_DDL)
                if set(meta)!={'version','course'} or meta['version']!=VERSION or json.loads(meta['course'])!=DAYS: raise ValueError('未知旧课程版本')
                rows=db.execute('SELECT * FROM events ORDER BY rowid')
            else:
                check_schema(db,DDL)
                if set(meta)!={'schema_version','activity_timezone','generation','legacy_queue_allowed','courses','settings'}: raise ValueError('元数据不完整')
                if meta['schema_version']!=str(SCHEMA_VERSION) or json.loads(meta['courses'])!=snapshots(): raise ValueError('未知结构或课程快照')
                ZoneInfo(meta['activity_timezone'])
                settings=json.loads(meta['settings'])
                if set(settings)!=set(DEFAULT_SETTINGS) or valid_settings(settings)!=settings: raise ValueError('备份配置不完整')
                if not re.fullmatch(r'[a-f0-9]{32}',meta['generation']) or meta['legacy_queue_allowed'] not in ('0','1'): raise ValueError('恢复代次无效')
                rows=db.execute('SELECT * FROM events ORDER BY rowid')
            counts={};earned=set()
            for row in rows:
                e=json.loads(row[1]);version,day,lesson_id,run,mode,task,_=event_task(e)
                if legacy and set(e)!=LEGACY_KEYS: raise ValueError('旧记录格式无效')
                if not valid_stamp(row[7]): raise ValueError('记录时间不正确')
                expected=row_values(e,row[7],meta.get('activity_timezone','Asia/Shanghai'))
                if tuple(row)!=(expected[:8] if legacy else expected): raise ValueError('记录内容不一致')
                key=(version,lesson_id,run)
                if counts.get(key,0)!=e['step']: raise ValueError('步骤顺序不一致')
                if run=='main' and day>1 and (version,day-1) not in earned: raise ValueError('先修课缺失')
                if run!='main' and (version,day) not in earned: raise ValueError('复习缺少原课程完成记录')
                counts[key]=e['step']+1
                if run=='main' and counts[key]==len(tasks_for(version,day)): earned.add((version,day))
            rewards=db.execute('SELECT * FROM rewards').fetchall()
            actual={(VERSION,r[0]) if legacy else (r[0],r[1]) for r in rewards}
            if actual!=earned or any(not valid_stamp(r[-1]) for r in rewards): raise ValueError('奖励记录不一致')
            return meta
    except (sqlite3.Error,TypeError,KeyError,json.JSONDecodeError,OSError,ZoneInfoNotFoundError,OverflowError) as err:
        raise ValueError('不是有效的小芽识字屋备份') from err

class Store:
    def __init__(self,path,timezone='Asia/Shanghai',locked=False):
        ZoneInfo(timezone)
        self.path=Path(path);self.path.parent.mkdir(parents=True,exist_ok=True)
        if self.path.exists() and self.path.stat().st_size:
            with self.connect() as db: meta=dict(db.execute('SELECT key,value FROM meta'))
            if 'schema_version' not in meta:
                with nullcontext() if locked else DataLock(self.path): self._migrate(timezone)
            elif meta['schema_version']!=str(SCHEMA_VERSION): raise ValueError('未知数据库结构版本')
        else:
            if any(Path(str(self.path)+suffix).exists() for suffix in ('-wal','-shm','-journal')):
                raise ValueError('主数据库缺失或为空，但发现恢复日志；未创建新库，请先核对旧记录')
            with self.connect() as db: self._initialize(db,timezone)
        with self.connect() as db:
            meta=dict(db.execute('SELECT key,value FROM meta'))
            if json.loads(meta['courses'])!=snapshots(): raise ValueError('课程快照不匹配，拒绝重解释旧记录')
            self.timezone=meta['activity_timezone'];ZoneInfo(self.timezone)

    def _initialize(self,db,timezone):
        db.executescript(DDL)
        db.executemany('INSERT INTO meta VALUES (?,?)',[
            ('schema_version',str(SCHEMA_VERSION)),('activity_timezone',timezone),
            ('generation',uuid.uuid4().hex),('legacy_queue_allowed','1'),
            ('courses',dumps(snapshots())),('settings',dumps(DEFAULT_SETTINGS))])

    def _migrate(self,timezone):
        validate_database(self.path)
        previous=self.path.with_name(self.path.name+'.pre-migration-'+uuid.uuid4().hex)
        self.backup(previous)  # Durable standalone snapshot before any schema write.
        with tempfile.TemporaryDirectory(dir=self.path.parent) as tmp:
            staged=Path(tmp)/'migrated.db'
            with sqlite3.connect(previous) as src,sqlite3.connect(staged) as dst:
                self._initialize(dst,timezone)
                for old in src.execute('SELECT * FROM events ORDER BY rowid'):
                    dst.execute('INSERT INTO events VALUES ('+','.join('?'*18)+')',row_values(json.loads(old[1]),old[7],timezone))
                dst.executemany('INSERT INTO rewards VALUES (?,?,?)',[(VERSION,*r) for r in src.execute('SELECT day,created FROM rewards')])
            validate_database(staged)
            # Refuse unresolved journal state rather than replacing a live database.
            if any(Path(str(self.path)+suffix).exists() for suffix in ('-wal','-shm','-journal')): raise ValueError('数据库日志尚未清理，未迁移')
            os.replace(staged,self.path)

    def connect(self):
        db=sqlite3.connect(self.path,timeout=10);db.execute('PRAGMA foreign_keys=ON');return db

    def settings(self,values=None):
        with self.connect() as db:
            if values is not None: db.execute('BEGIN IMMEDIATE')
            current=json.loads(db.execute("SELECT value FROM meta WHERE key='settings'").fetchone()[0])
            if values is not None:
                if not isinstance(values,dict): raise ValueError('无效配置')
                current=valid_settings(dict(current,**values))
                db.execute("UPDATE meta SET value=? WHERE key='settings'",(dumps(current),))
        return current

    def state(self,now=None,timezone=None):
        today=datetime.fromtimestamp(time.time() if now is None else now,ZoneInfo(self.timezone)).date()
        week=today-timedelta(days=today.weekday())
        with self.connect() as db:
            db.execute('BEGIN')
            meta=dict(db.execute('SELECT key,value FROM meta'));courses={}
            for course in COURSES:
                v=course['version']
                pos={str(d['day']):0 for d in course['days']}
                pos.update({str(r[0]):r[1] for r in db.execute("SELECT day,COUNT(*) FROM events WHERE course_version=? AND run_id='main' GROUP BY day",(v,))})
                stats={r[0]:dict(attempts=r[1],correct=r[2],wrong=r[1]-r[2],status='revisit' if r[1]>r[2] else 'learning') for r in db.execute('SELECT character,COUNT(*),SUM(correct) FROM events WHERE course_version=? AND correct IS NOT NULL AND character IS NOT NULL GROUP BY character',(v,))}
                rewards=[r[0] for r in db.execute('SELECT day FROM rewards WHERE course_version=? ORDER BY day',(v,))]
                courses[v]=dict(positions=pos,stats=stats,rewards=rewards)
            runs=[dict(course_version=r[0],day=r[1],lesson_id=r[2],run_id=r[3],position=r[4],complete=r[4]==len(tasks_for(r[0],r[1]))) for r in db.execute('SELECT course_version,day,lesson_id,run_id,COUNT(*) FROM events GROUP BY course_version,lesson_id,run_id ORDER BY MIN(rowid)')]
            dates=db.execute('SELECT activity_date,COUNT(*) FROM events WHERE activity_date>=? AND activity_date<=? GROUP BY activity_date',(str(week),str(today))).fetchall()
            cal=dict(timezone=self.timezone,date=str(today),week_start=str(week),today_steps=sum(n for d,n in dates if d==str(today)),week_steps=sum(n for _,n in dates),week_active_days=len(dates))
            contacted=db.execute('SELECT COUNT(DISTINCT character) FROM events WHERE character IS NOT NULL').fetchone()[0]
            return dict(version=VERSION,schema_version=SCHEMA_VERSION,generation=meta['generation'],courses=courses,runs=runs,
                        **courses[VERSION],calendar=cal,settings=json.loads(meta['settings']),
                        mastery=dict(confirmed=0,status='unassessed',note='尚无无提示认读检查证据，课程完成不计为掌握'),contacted_characters=contacted)

    def submit(self,e):
        version,day,lesson_id,run,mode,task,legacy=event_task(e)
        payload=dumps(e)
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            old=db.execute('SELECT payload FROM events WHERE id=?',(e['id'],)).fetchone()
            if old:
                if old[0]!=payload: raise ValueError('重复标识的内容不同')
            else:
                meta=dict(db.execute('SELECT key,value FROM meta'))
                if (legacy and meta['legacy_queue_allowed']!='1') or (not legacy and e['generation']!=meta['generation']): raise ValueError('数据库已恢复，旧暂存需要核对，未写入')
                required=day-1 if run=='main' else day
                if required>0 and not db.execute('SELECT 1 FROM rewards WHERE course_version=? AND day=?',(version,required)).fetchone(): raise ValueError('先完成相应课程')
                count=db.execute('SELECT COUNT(*) FROM events WHERE course_version=? AND lesson_id=? AND run_id=?',(version,lesson_id,run)).fetchone()[0]
                if count!=e['step']: raise ValueError('进度已改变，请刷新')
                received=time.time()
                db.execute('INSERT INTO events VALUES ('+','.join('?'*18)+')',row_values(e,received,self.timezone))
                if run=='main' and e['step']==len(tasks_for(version,day))-1:
                    db.execute('INSERT OR IGNORE INTO rewards VALUES (?,?,?)',(version,day,received))
        return self.state()

    def calendar(self,month,timezone=None,now=None,course_version=None):
        if not isinstance(month,str) or not re.fullmatch(r'[0-9]{4}-[0-9]{2}',month): raise ValueError('无效月份')
        year,number=map(int,month.split('-'))
        if not 1900<=year<=9998 or not 1<=number<=12: raise ValueError('无效月份')
        if course_version: get_course(course_version)
        first=date(year,number,1);length=monthlib.monthrange(year,number)[1]
        end=date(year+1,1,1) if number==12 else date(year,number+1,1)
        today=datetime.fromtimestamp(time.time() if now is None else now,ZoneInfo(self.timezone)).date().isoformat()
        days={f'{month}-{d:02}':dict(date=f'{month}-{d:02}',steps=0,new_characters=[],review_characters=[],contacted_characters=[],review_questions=0,review_correct=0,other_questions=0,other_correct=0,completed=[],lessons=[],sources=[],modes=[]) for d in range(1,length+1)}
        with self.connect() as db:
            query='SELECT course_version,day,lesson_id,run_id,kind,character,correct,activity_date,time_basis,mode FROM events WHERE activity_date>=? AND activity_date<?'
            args=[str(first),str(end)]
            if course_version: query+=' AND course_version=?';args.append(course_version)
            for v,day,lid,run,kind,char,correct,when,basis,mode in db.execute(query+' ORDER BY rowid',args):
                item=days[when];item['steps']+=1
                info=dict(course_version=v,lesson_id=lid,title=get_course(v)['days'][day-1]['title'],run_id=run)
                if info not in item['lessons']: item['lessons'].append(info)
                for key,value in [('sources',basis),('modes',mode),('contacted_characters',char)]:
                    if value is not None and value not in item[key]: item[key].append(value)
                review=kind=='review' or (run!='main' and char is not None)
                group='review_characters' if review else 'new_characters' if kind=='learn' else None
                if group and char and char not in item[group]: item[group].append(char)
                if correct is not None:
                    prefix='review' if review else 'other'
                    item[prefix+'_questions']+=1;item[prefix+'_correct']+=correct
                if kind=='reward': item['completed'].append(info)
        return dict(month=month,today=today,timezone=self.timezone,leading_empty=first.weekday(),days=list(days.values()),
                    updated_at=datetime.fromtimestamp(time.time(),ZoneInfo(self.timezone)).isoformat(),
                    time_note='客户端发生时间按设备报告；旧版及无效设备时间按保存日期统计。统计时区固定，部署时区变更不会改写历史。')

    def backup(self,path):
        with self.connect() as src,sqlite3.connect(path) as dst: src.backup(dst)
