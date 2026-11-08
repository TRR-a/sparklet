// Updater dialog: notify-only notification [更新弹窗 - 仅提醒通知]

import type { ManifestEntry, DialogResponse } from 'sparklet/shared/types/updater/updater.js';
import { promptRendererDialog } from './dialog-core.js';
import { formatDate } from './dialog-format-date.js';

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
