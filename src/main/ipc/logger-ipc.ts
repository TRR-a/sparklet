// Renderer -> main log bridge [渲染进程到主进程的日志桥]
// Renderers cannot touch the filesystem directly; they send {level, tag, message}
// over this channel and the main process writes it through the shared logger sink.
// [渲染进程不能直接写文件，通过此通道发送 {level, tag, message}，由主进程经统一 logger 落盘]

import { ipcMain } from 'electron';
import { writeScoped, type LogLevel } from '../services/logger';

interface RendererLogPayload {
  level?: string;
  scope?: string;
  tag?: string;
  message?: string;
}

const VALID: ReadonlySet<string> = new Set(['debug', 'info', 'warn', 'error']);

export function registerLoggerIpc(): void {
  ipcMain.on('logger:write', (_event, payload: RendererLogPayload) => {
    const level = VALID.has(String(payload?.level)) ? (payload.level as LogLevel) : 'info';
    // scope routes the line: 'kernel'/'' goes to sparklet.main/, anything else to modules/<scope>/
    // [scope 决定写入目录：kernel/空 写入 sparklet.main/，其余写入 modules/<scope>/]
    const scope = typeof payload?.scope === 'string' && payload.scope ? payload.scope : 'main';
    const tag = payload?.tag ? `${scope}:${payload.tag}` : scope;
    const message = typeof payload?.message === 'string' ? payload.message : String(payload?.message ?? '');
    writeScoped(level, scope, tag, message);
  });
}
