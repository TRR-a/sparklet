// Settings window: data cleanup buttons (note history / custom colors) [设置窗口 - 数据清理按钮 (笔记历史/自定义颜色)]

import { showToast } from 'sparklet/renderer/shared/ui/toast/toast.js';
import { t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { storeApi } from 'sparklet/renderer/shared/index.js';
import { noteApi } from 'sparklet/renderer/app/api/note-api.js';

/** Bind "clear all note history" and "clear custom colors" buttons [绑定"清空全部笔记历史"与"清空自定义颜色"按钮] */
export function bindCleanupButtons(): void {
  // Clear all note history [清空所有笔记历史]
  const clearHistoryBtn = document.getElementById('clearHistoryBtn') as HTMLButtonElement | null;
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', async () => {
      const confirmed = confirm(t('settings.history.confirm') || '确定要清空所有笔记历史吗？此操作不可恢复。');
      if (!confirmed) return;
      clearHistoryBtn.disabled = true;
      try {
        const result = await noteApi.clearAllHistory();
        if (result.success) {
          showToast(t('settings.history.cleared') || `已清空 ${result.count} 个笔记的历史`);
        } else {
          showToast(t('settings.history.failed') || '清空失败: ' + (result.error || ''));
        }
      } finally {
        clearHistoryBtn.disabled = false;
      }
    });
  }

  // Clear custom color history [清空自定义颜色记录]
  const clearCustomColorsBtn = document.getElementById('clearCustomColorsBtn') as HTMLButtonElement | null;
  if (clearCustomColorsBtn) {
    clearCustomColorsBtn.addEventListener('click', async () => {
      const confirmed = confirm(t('settings.customColor.confirm') || '确定要清空自定义颜色记录吗？');
      if (!confirmed) return;
      clearCustomColorsBtn.disabled = true;
      try {
        await storeApi.set('recentColors', []);
        showToast(t('settings.customColor.cleared') || '已清空自定义颜色记录');
      } finally {
        clearCustomColorsBtn.disabled = false;
      }
    });
  }
}
