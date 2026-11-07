// System command & timing helpers [系统命令与计时辅助]

import { execFile } from 'child_process';

/** Sleep for the given ms [等待指定毫秒] */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Run a command without a shell, resolve stdout (never throws - returns '' on error) [不经 shell 执行命令，返回 stdout (不抛错，失败返回空串)] */
export function run(cmd: string, args: string[]): Promise<string> {
  return new Promise(resolve => {
    execFile(cmd, args, { timeout: 4000, windowsHide: true, maxBuffer: 1024 * 1024 }, (err, stdout) => {
      if (err) { resolve(''); return; }
      resolve(typeof stdout === 'string' ? stdout : '');
    });
  });
}
