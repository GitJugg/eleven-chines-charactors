"""Offline restore, with validation, exclusive service lock and pre-restore copy."""
import argparse,json,math,os,shutil,sqlite3,sys,tempfile,time,uuid
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from store import Store, validate_database
from data_lock import DataLock
from course import VERSION,DAYS

def validate(path):
    return validate_database(path)

def restore(source,target,confirm,timezone=None):
    if confirm!='RESTORE':raise ValueError('必须明确输入 RESTORE')
    source=Path(source).resolve();target=Path(target).resolve()
    if source==target:raise ValueError('备份与目标不能是同一文件')
    if not source.is_file():raise ValueError('备份不存在')
    validate(source)
    target.parent.mkdir(parents=True,exist_ok=True)
    with DataLock(target):
        # Orphan journals can replay over a newly restored main database. Never delete them.
        for suffix in ('-wal','-shm','-journal'):
            if Path(str(target)+suffix).exists():raise ValueError('发现数据库日志文件；请先核对并恢复旧数据库状态，没有替换当前数据')
        restore_timezone=timezone or os.environ.get('APP_TIMEZONE','Asia/Shanghai')
        if timezone is None and target.exists():
            try:
                with sqlite3.connect(target.as_uri()+'?mode=ro',uri=True) as current:
                    row=current.execute("SELECT value FROM meta WHERE key='activity_timezone'").fetchone()
                    if row:restore_timezone=row[0]
            except sqlite3.Error:pass  # A damaged target can be replaced from a valid backup.
        # Create and validate a self-contained SQLite snapshot before replacing anything.
        with tempfile.TemporaryDirectory(dir=target.parent) as tmp:
            staged=Path(tmp)/'restored.sqlite3'
            with sqlite3.connect(source.as_uri()+'?mode=ro',uri=True) as src,sqlite3.connect(staged) as dst:src.backup(dst)
            staged_meta=validate(staged)
            # Migrate only the private staged copy; never alter the selected backup.
            staged_store=Store(staged,timezone=restore_timezone) if 'schema_version' not in staged_meta else Store(staged)
            with staged_store.connect() as db:
                db.execute("UPDATE meta SET value=? WHERE key='generation'",(uuid.uuid4().hex,))
                db.execute("UPDATE meta SET value='0' WHERE key='legacy_queue_allowed'")
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
    parser.add_argument('--timezone',help='仅为旧版备份指定原统计时区；已有版本化记录保持其固定时区')
    args=parser.parse_args()
    try:
        old=restore(args.backup,Path(args.data_dir)/'progress.sqlite3',args.confirm,timezone=args.timezone)
        print('恢复完成。恢复前副本：'+str(old) if old else '恢复完成，新数据库已建立。')
    except (ValueError,RuntimeError,OSError) as e:parser.exit(1,f'恢复未完成：{e}\n')
if __name__=='__main__':main()
