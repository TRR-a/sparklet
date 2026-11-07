// Updater error: network-level friendly messages [更新器错误 - 网络类友好提示]

import type { NetworkErrorType } from 'sparklet/shared/types/updater';

/** Friendly message for a classified network error [分类网络错误的友好提示] */
export function networkErrorMessage(type: NetworkErrorType, ctxLabel: string): string | null {
  switch (type) {
    case 'offline':
      return `⚠️ ${ctxLabel}失败：当前网络不可用，请检查网络连接（WiFi/网线/代理）后重试`;
    case 'rate-limit':
      return `⚠️ ${ctxLabel}失败：GitHub API 访问频率超限，请 1 小时后再试`;
    case 'server-error':
      return `⚠️ ${ctxLabel}失败：服务器暂时不可用，请稍后重试或去官网手动下载`;
    case 'write-error':
      return `⚠️ ${ctxLabel}失败：写入本地文件失败，请检查磁盘空间或权限后重试`;
    default:
      return null;
  }
}
