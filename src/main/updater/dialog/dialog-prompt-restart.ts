// Updater dialog: restart confirmation [更新弹窗 - 重启确认]

import type { ManifestEntry, DialogResponse } from 'sparklet/shared/types/updater';
import { promptRendererDialog } from './dialog-core.js';
import { formatDate } from './dialog-format-date.js';

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
