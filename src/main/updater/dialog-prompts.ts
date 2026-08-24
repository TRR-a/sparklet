// Update-specific dialog prompts - new version / notify-only / restart confirmation [更新专用弹窗 - 新版本/仅提醒/重启确认]

import type {
  ManifestEntry,
  DialogResponse,
} from '../../shared/types/updater';
import { promptRendererDialog } from './dialog-core';

/**
 * Format date for display [格式化日期显示]
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '未知';
  try {
    const date = new Date(isoString);
    return date.toISOString().split('T')[0];
  } catch {
    return String(isoString);
  }
}

/**
 * Show "new version found" dialog (renderer custom UI, i18n friendly) [显示「发现新版本」对话框 (渲染层自定义 UI，i18n 友好)]
 * @returns 0=update now, 1=later [0=立即更新, 1=稍后]
 */
export async function showUpdateDialog(currentVersion: string, entry: ManifestEntry): Promise<DialogResponse> {
  const version = entry.version || `v${currentVersion}`;
  const codename = entry.internalCodename || 'N/A';
  const releaseDate = formatDate(entry.releaseDate);
  const pkgHash = entry.packageHash || entry.hash;
  const hashPrefix = pkgHash ? pkgHash.slice(0, 6) : '';

  return promptRendererDialog('update-confirm', {
    newVersion: version,
    codename,
    releaseDate,
    hashPrefix,
    currentVersion: `v${currentVersion}`
  });
}

/**
 * Show "notify-only" mode notification (renderer custom UI) [显示「仅提醒」模式的通知 (渲染层自定义 UI)]
 */
export async function showNotifyOnlyDialog(currentVersion: string, entry: ManifestEntry, releaseUrl: string): Promise<DialogResponse> {
  const version = entry.version || `v${currentVersion}`;
  const codename = entry.internalCodename || 'N/A';
  const releaseDate = formatDate(entry.releaseDate);

  return promptRendererDialog('notify-only', {
    newVersion: version,
    codename,
    releaseDate,
    releaseUrl
  });
}

/**
 * Show "restart confirmation" dialog (30s timeout auto-selects "later") [显示「重启确认」对话框 (30s 超时自动选「稍后」)]
 * @returns 0=restart now, 1=later [0=立即重启, 1=稍后]
 */
export async function showRestartDialog(targetVersion: string, entry: ManifestEntry): Promise<DialogResponse & { timedOut?: boolean }> {
  const version = entry.version || `v${targetVersion}`;
  const codename = entry.internalCodename || 'N/A';
  const releaseDate = formatDate(entry.releaseDate);

  const response = await promptRendererDialog(
    'restart-confirm',
    {
      targetVersion: version,
      codename,
      releaseDate
    },
    {
      timeoutMs: 30000,
      fallbackResponse: { buttonIndex: 1, timedOut: true }
    }
  );
  return response;
}
