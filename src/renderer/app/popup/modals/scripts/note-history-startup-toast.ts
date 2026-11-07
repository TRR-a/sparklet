// Note history modal: startup integrity toast [笔记历史弹窗 - 启动完整性提示]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { showToast } from 'sparklet/renderer/shared/ui/toast.js';
import { noteApi } from 'sparklet/renderer/app/api/note-api.js';

/**
 * Show a toast when the startup integrity scan repaired or quarantined notes
 * [启动完整性扫描修复或隔离了笔记时显示提示]
 */
export async function showNoteHistoryStartupToast(): Promise<void> {
  try {
    const result = await noteApi.integrityReport();
    if (!result.success || !result.report) return;
    const { repairedNotes, quarantinedNotes } = result.report;
    if (repairedNotes > 0) {
      showToast(t('history.recoveredToast', { n: String(repairedNotes) }), 'warning', 5000);
    } else if (quarantinedNotes.length > 0) {
      showToast(t('history.quarantinedToast', { n: String(quarantinedNotes.length) }), 'error', 6000);
    }
  } catch (err) {
    console.warn('[NoteHistory] integrity report unavailable:', err);
  }
}
