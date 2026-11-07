// Per-note write serialization lock [同笔记写操作串行锁]

/**
 * Per-note write serialization: save/delete IPC handlers run concurrently in the
 * main process; without a lock, a save's readJson can happen before a delete's
 * write and its writeFile after, reverting isDeleted to false (resurrecting a
 * trashed note) [同笔记写操作串行锁：IPC 处理器在主进程并发执行，保存的读与写若
 * 夹住删除的写，会把 isDeleted 覆盖回 false 导致已删除笔记复活]
 */
const noteWriteLocks = new Map<string, Promise<unknown>>();

/** Run fn serialized per note id [按笔记 ID 串行执行] */
export function withNoteLock<T>(id: string, fn: () => Promise<T>): Promise<T> {
  const prev = noteWriteLocks.get(id) ?? Promise.resolve();
  const run = prev.then(fn, fn); // fn ignores the previous outcome [fn 不关心前序结果]
  noteWriteLocks.set(id, run);
  const release = () => {
    if (noteWriteLocks.get(id) === run) noteWriteLocks.delete(id);
  };
  run.then(release, release);
  return run;
}
