// Window IPC handlers [窗口 IPC 处理器]
// Handles window control (minimize/maximize/close), dev tools, and window creation [处理窗口控制 (最小化/最大化/关闭)、开发者工具、窗口创建]
// DevTools global shortcut in devtools-shortcut.ts [开发者工具全局快捷键在 devtools-shortcut.ts]
//
// Split out [已拆分]：control → window-ipc-control.ts, devtools → window-ipc-devtools.ts,
// creation → window-ipc-create.ts, runtime versions → window-ipc-runtime.ts.

import { registerWindowControlIpc } from './window-ipc-control.js';
import { registerWindowDevToolsIpc } from './window-ipc-devtools.js';
import { registerWindowCreateIpc } from './window-ipc-create.js';
import { registerRuntimeVersionsIpc } from './window-ipc-runtime.js';

export { registerDevToolsShortcut } from '../app/devtools-shortcut.js';

/**
 * Register window control IPC handlers [注册窗口控制 IPC 处理器]
 */
export function registerWindowIpcHandlers(): void {
  registerWindowControlIpc();
  registerWindowDevToolsIpc();
  registerWindowCreateIpc();
  registerRuntimeVersionsIpc();
}
