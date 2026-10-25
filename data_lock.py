"""Cooperative exclusive lock shared by the server and offline restore CLI."""
from pathlib import Path
import fcntl
class DataLock:
    def __init__(self,database):
        path=Path(str(database)+'.lock');path.parent.mkdir(parents=True,exist_ok=True)
        self.handle=path.open('a+')
        try:fcntl.flock(self.handle,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError:
            self.handle.close()
            raise RuntimeError('学习服务仍在运行或另一恢复操作未结束，请先停止服务') from None
    def close(self):
        if not self.handle.closed:
            fcntl.flock(self.handle,fcntl.LOCK_UN);self.handle.close()
    def __enter__(self):return self
    def __exit__(self,*args):self.close()
