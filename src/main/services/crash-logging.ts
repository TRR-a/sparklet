// Crash & fatal-error logging [崩溃与致命错误日志]

import { app } from 'electron';
import { write, errText, markConsoleBroken } from './logger-writer.js';

/**
 * Install crash & fatal-error capture: main-process exceptions, renderer process
 * loss, child (GPU/utility) process loss, and a session-end marker. Everything
 * goes to the log only — no native dialogs — so the file tells the whole story
 * of a session after the fact.
 * [安装崩溃与致命错误捕获：主进程异常、渲染进程退出、子进程 (GPU等) 退出与会话结束标记。
 *  仅落盘不弹原生对话框，事后日志可还原整个会话的完整故事线]
 */
export function installCrashLogging(): void {
  const uptime = () => `uptime ${Math.round(process.uptime())}s`;
  process.on('uncaughtException', (err) => {
    // Broken stdout/stderr pipe (parent terminal closed): the console mirror is
    // now impossible — disable it or every mirrored write throws EPIPE again
    // and the handler recurses forever. [控制台管道已断 (父终端关闭)：镜像已不可能，
    // 必须停用，否则每次镜像写入都会再抛 EPIPE，处理器无限递归]
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'EPIPE' || code === 'EIO') {
      markConsoleBroken();
      write('warn', 'main', 'logger', `Console pipe broken (${code}); console mirror disabled`);
      return;
    }
    write('error', 'main', 'crash', `Uncaught exception (${uptime()}):\n${errText(err)}`);
  });
  process.on('unhandledRejection', (reason) => {
    write('error', 'main', 'crash', `Unhandled rejection (${uptime()}):\n${errText(reason)}`);
  });
  app.on('render-process-gone', (_event, _webContents, details) => {
    write('error', 'main', 'crash', `Renderer process gone (${uptime()}): reason=${details.reason} exitCode=${details.exitCode}`);
  });
  app.on('child-process-gone', (_event, details) => {
    write('warn', 'main', 'crash', `Child process gone: type=${details.type} reason=${details.reason}`);
  });
  app.on('before-quit', () => {
    write('info', 'main', 'logger', `Session end (uptime ${Math.round(process.uptime())}s)`);
  });
}
