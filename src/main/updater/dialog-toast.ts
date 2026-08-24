// Toast broadcast & friendly error formatting [Toast 广播与友好错误格式化]

import { BrowserWindow } from 'electron';
import type {
  ToastData,
  NetworkErrorType,
} from '../../shared/types/updater';
import { classifyNetworkError } from './constants';

/**
 * Broadcast Toast to all windows [向所有窗口发送 Toast (广播)]
 * message supports two formats: [message 支持两种格式：]
 *   - String: display directly (backward compat), won't auto-translate on language switch [字符串：直接显示 (兼容旧代码)，不会随语言切换自动翻译]
 *   - { key: 'i18n.key.path', params?: { foo: 'bar' } }: renderer calls t(key, params) to translate, supports language switch [{ key: 'i18n.key.path', params?: { foo: 'bar' } }：渲染层会调 t(key, params) 翻译，支持语言切换]
 */
export function broadcastToast(
  message: string | { key: string; params?: Record<string, string> },
  type: ToastData['type'] = 'info',
  duration: number = 3000
): void {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send('toast:show', { message, type, duration });
    }
  }
  const msgForLog = typeof message === 'string' ? message : `i18n:${message?.key}`;
  console.log('[Updater] Toast broadcast: type=' + type + ', duration=' + duration + 'ms, msg=' + msgForLog);
}

/**
 * Convert raw English error from update flow to user-friendly Chinese prompt [把更新流程里的原始英文错误转换成用户能看懂的中文提示]
 * @param errorMsg Original error message [原始错误消息]
 * @param errorType Classification from classifyNetworkError (if omitted, inferred from errorMsg) [classifyNetworkError 返回的分类 (缺省会尝试从 errorMsg 推断)]
 * @param context Which stage the error occurred in, for more precise prompt [发生在哪个阶段，提示更精准]
 */
export function formatFriendlyUpdateError(
  errorMsg: string | null,
  errorType: NetworkErrorType | null,
  context: 'check' | 'download-zip' | 'download-manifest' | 'verify' | 'install' = 'check'
): string {
  const type: NetworkErrorType = (errorType && errorType !== 'unknown')
    ? errorType
    : classifyNetworkError(errorMsg);

  const ctxLabel = (() => {
    switch (context) {
      case 'download-zip':     return '下载更新包';
      case 'download-manifest':return '获取版本信息';
      case 'verify':           return '校验安装包';
      case 'install':          return '安装更新';
      case 'check':
      default:                 return '检查更新';
    }
  })();

  switch (type) {
    case 'offline':
      return `⚠️ ${ctxLabel}失败：当前网络不可用，请检查网络连接（WiFi/网线/代理）后重试`;
    case 'rate-limit':
      return `⚠️ ${ctxLabel}失败：GitHub API 访问频率超限，请 1 小时后再试`;
    case 'server-error':
      return `⚠️ ${ctxLabel}失败：服务器暂时不可用，请稍后重试或去官网手动下载`;
    case 'write-error':
      return `⚠️ ${ctxLabel}失败：写入本地文件失败，请检查磁盘空间或权限后重试`;
    case 'unknown':
    default: {
      // Common business errors: filename mismatch / invalid tag etc., provide fallback Chinese prompt [常见业务错误：文件名不匹配 / tag 不合法等，给兜底中文提示]
      const m = String(errorMsg || '').toLowerCase();
      if (m.includes('invalid tag format')) return `⚠️ ${ctxLabel}失败：GitHub Release 版本号格式异常`;
      if (m.includes('invalid zip filename')) return `⚠️ ${ctxLabel}失败：更新包文件名格式不匹配`;
      if (m.includes('manifest.releases.json not found')) return `⚠️ ${ctxLabel}失败：更新清单文件缺失，请稍后重试`;
      if (m.includes('failed to parse github api')) return `⚠️ ${ctxLabel}失败：GitHub 返回数据异常`;
      if (m.includes('unable to acquire temp directory')) return `⚠️ ${ctxLabel}失败：无法创建临时目录，请检查权限`;
      if (m.includes('sha256') || m.includes('packagehash') || m.includes('hash mismatch') || m.includes('integrity')) {
        return `⚠️ ${ctxLabel}失败：安装包完整性校验未通过（文件可能损坏），请重新下载`;
      }
      // Completely unknown: add generic fallback [完全未知：带一句通用兜底]
      return `⚠️ ${ctxLabel}失败，请稍后重试或去 GitHub 官网手动下载`;
    }
  }
}
