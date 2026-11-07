// Main process entry point [主进程入口]
// Orchestrates app lifecycle: migration, window creation, updater initialization, IPC registration [编排应用生命周期：迁移、窗口创建、更新模块初始化、IPC 注册]
// Ready sequence in lifecycle/ready.ts, window/app events in lifecycle/app-events.ts
// [就绪序列在 lifecycle/ready.ts，窗口与应用事件在 lifecycle/app-events.ts]

import './bootstrap/dev-user-data.js'; // Must be first — redirects userData before any store/path access [必须第一个，在任何 store/路径访问前重定向 userData]
import './bootstrap/console-timestamp.js'; // Second — prefix all console output with [mm:ss] [第二个，给所有控制台输出加 [mm:ss] 前缀]
import { BrowserWindow } from 'electron';
import { registerReadyLifecycle } from './lifecycle/ready.js';
import { registerWindowClosedLifecycle, registerActivateLifecycle } from './lifecycle/app-events.js';

registerReadyLifecycle();
registerWindowClosedLifecycle();
registerActivateLifecycle();

// Prevent creating additional garbage collection references [防止创建额外的 GC 引用]
export { BrowserWindow };
