"""Offline restore, with validation, exclusive service lock and pre-restore copy."""
import argparse,json,math,os,shutil,sqlite3,sys,tempfile,time,uuid
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from store import Store
from data_lock import DataLock
from course import VERSION,DAYS

def validate(path):
    try:
        with sqlite3.connect(Path(path).resolve().as_uri()+'?mode=ro',uri=True) as db:
            if db.execute('PRAGMA integrity_check').fetchone()!=('ok',):raise ValueError('数据库完整性检查失败')
            with tempfile.TemporaryDirectory() as tmp:
                reference=Store(Path(tmp)/'reference.db')
                with reference.connect() as ref:
                    expected=ref.execute("SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name").fetchall()
                actual=db.execute("SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name").fetchall()
                if actual!=expected:raise ValueError('备份数据库结构不匹配')
                meta=dict(db.execute('SELECT key,value FROM meta'))
                if set(meta)!={'version','course'} or meta['version']!=VERSION or json.loads(meta['course'])!=DAYS:raise ValueError('课程版本或内容不匹配')
                rows=db.execute('SELECT id,payload,day,step,answer,correct,character,created FROM events ORDER BY day,step LIMIT 1000').fetchall()
                if len(rows)>=1000:raise ValueError('记录数量不合理')
                for row in rows:
                    event=json.loads(row[1]);reference.submit(event)
                    with reference.connect() as ref:written=ref.execute('SELECT id,payload,day,step,answer,correct,character FROM events WHERE id=?',(event['id'],)).fetchone()
                    if tuple(row[:7])!=written or not isinstance(row[7],(float,int)) or not math.isfinite(row[7]) or not 0<row[7]<=time.time()+86400:raise ValueError('记录内容不一致')
                rewards=db.execute('SELECT day,created FROM rewards ORDER BY day').fetchall()
                if [r[0] for r in rewards]!=reference.state()['rewards']:raise ValueError('奖励记录不一致')
                if any(not isinstance(r[1],(int,float)) or not math.isfinite(r[1]) or not 0<r[1]<=time.time()+86400 for r in rewards):raise ValueError('奖励日期不正确')
    except (sqlite3.Error,TypeError,KeyError,json.JSONDecodeError,OSError) as e:
        raise ValueError('不是有效的小芽识字屋备份') from e

def restore(source,target,confirm):
    if confirm!='RESTORE':raise ValueError('必须明确输入 RESTORE')
    source=Path(source).resolve();target=Path(target).resolve()
    if source==target:raise ValueError('备份与目标不能是同一文件')
    if not source.is_file():raise ValueError('备份不存在')
    validate(source)
    target.parent.mkdir(parents=True,exist_ok=True)
    with DataLock(target):
        # Create and validate a self-contained SQLite snapshot before replacing anything.
        with tempfile.TemporaryDirectory(dir=target.parent) as tmp:
            staged=Path(tmp)/'restored.sqlite3'
            with sqlite3.connect(source.as_uri()+'?mode=ro',uri=True) as src,sqlite3.connect(staged) as dst:src.backup(dst)
            validate(staged)
            previous=None
            if target.exists():
                previous=target.with_name(target.name+'.pre-restore-'+time.strftime('%Y%m%d-%H%M%S')+'-'+uuid.uuid4().hex[:8])
                shutil.copy2(target,previous)
                for suffix in ('-wal','-shm','-journal'):
                    if Path(str(target)+suffix).exists():raise ValueError('发现数据库日志文件，请先确认服务完全停止并完成数据库检查；没有替换当前数据')
            os.replace(staged,target)
            return previous

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('backup');parser.add_argument('--data-dir',required=True);parser.add_argument('--confirm',required=True,choices=['RESTORE'])
    args=parser.parse_args()
    try:
        old=restore(args.backup,Path(args.data_dir)/'progress.sqlite3',args.confirm)
        print('恢复完成。恢复前副本：'+str(old) if old else '恢复完成，新数据库已建立。')
    except (ValueError,RuntimeError,OSError) as e:parser.exit(1,f'恢复未完成：{e}\n')
if __name__=='__main__':main()
