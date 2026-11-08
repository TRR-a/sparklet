// Updater dialog: new version found [更新弹窗 - 发现新版本]

import type { ManifestEntry, DialogResponse } from 'sparklet/shared/types/updater/updater.js';
import { promptRendererDialog } from './dialog-core.js';
import { formatDate } from './dialog-format-date.js';

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
