// Updater error: business-error fallbacks [更新器错误 - 业务错误兜底提示]

/** Map a business error payload to a Chinese prompt [把业务错误内容映射为中文提示] */
export function businessErrorMessage(errorMsg: string | null, ctxLabel: string): string {
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
