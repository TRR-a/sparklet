// Window manager: holds references to all app windows and provides sync helpers - barrel [窗口管理器 - 汇总出口]
// Microkernel layout: the welcome window is created at startup; the
// "main window" slot tracks the official Main window (used for settings glow sync).
// [微内核布局：启动时创建 Welcome 窗口；"主窗口" 槽位跟踪官方 Main 窗口
// (用于设置窗口光晕同步)]
//
// Split out [已拆分]：registry & accessors → window-registry.ts,
// glow sync → window-glow-sync.ts.

export {
  getWelcomeWindow,
  setWelcomeWindow,
  getMainWindow,
  setMainWindow,
  getSettingsWindow,
  setSettingsWindow,
  getAboutWindow,
  setAboutWindow,
} from './window-registry.js';
export { syncGlowPosition, type WindowBounds, type GlowSyncData } from './window-glow-sync.js';
