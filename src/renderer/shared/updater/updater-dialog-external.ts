// Updater dialog: external link opener [更新器弹窗 - 外链打开]

import { windowApi } from 'sparklet/renderer/shared/index.js';

/**
 * Open external URL via main process IPC (with http/https protocol whitelist) [通过主进程 IPC 打开外链 (带 http/https 协议白名单)]
 */
export function openExternal(url: string): void {
  if (window.sparklet) {
    windowApi.openExternal(url).catch((): void => {});
  }
}
