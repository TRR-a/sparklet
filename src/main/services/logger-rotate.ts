// Logger: file rotation + backup pruning [日志 - 文件轮转与备份清理]

import * as fs from 'fs';
import * as path from 'path';

/** 5 MB rotation threshold per file [每个文件 5 MB 轮转阈值] */
const MAX_BYTES = 5 * 1024 * 1024;
/** Number of rotated backups kept per file [每个文件保留的轮转备份数] */
const MAX_BACKUPS = 5;

/** Rotate one file if it exceeds MAX_BYTES, prune old backups [单文件超限则轮转并清理旧备份] */
export function rotateIfNeeded(dir: string, file: string, backupPrefix: string): void {
  try {
    if (!fs.existsSync(file) || fs.statSync(file).size <= MAX_BYTES) return;
    fs.renameSync(file, path.join(dir, `${backupPrefix}.${Date.now()}.log`));
    const old = fs.readdirSync(dir)
      .filter((f) => new RegExp(`^${backupPrefix}\\.[0-9]+\\.log$`).test(f))
      .sort()
      .reverse();
    for (const f of old.slice(MAX_BACKUPS)) {
      try { fs.unlinkSync(path.join(dir, f)); } catch { /* ignore */ }
    }
  } catch { /* best effort [尽力而为] */ }
}
