// Settings window: preference switches (language / theme / clock) [设置窗口 - 偏好开关 (语言/主题/时钟)]

import { loadLanguage, t } from 'sparklet/renderer/shared/i18n/i18n.js';
import { showToast } from 'sparklet/renderer/shared/ui/toast.js';
import { setTheme } from 'sparklet/renderer/shared/ui/theme.js';
import { storeApi, broadcastApi } from 'sparklet/renderer/shared/index.js';
import { loadUpdateHint } from '../updater/scripts/updater-config.js';

/** Bind language / theme / clock-format switches (includes custom dropdown init) [绑定语言/主题/时钟制式开关 (含自定义下拉初始化)] */
export async function bindPreferences(): Promise<void> {
  // ==================== Language switch [语言切换] ==========
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    languageSelect.addEventListener('change', async (e: Event) => {
      const target = e.target as HTMLSelectElement;
      const newLang = target.value;
      const success = await loadLanguage(newLang);
      if (success) {
        showToast('✅ ' + t('settings.languageChangeSuccess'));
        console.log('语言已切换为：', newLang);
        await loadUpdateHint();
      }
    });
  }

  // ==================== Theme switch [主题切换] ==========================
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    themeSelect.addEventListener('change', async (e: Event) => {
      const target = e.target as HTMLSelectElement;
      const newTheme = target.value;
      setTheme(newTheme);
      await storeApi.set('theme', newTheme);
      await broadcastApi.notifyThemeChanged(newTheme);
    });
  }

  // ==================== Clock format switch (12-hour toggle) [时钟制式开关] ==========================
  const clock12hToggle = document.getElementById('clock12hToggle') as HTMLInputElement | null;
  if (clock12hToggle) {
    // Load current value (default 24-hour when unset) [读取当前值 (未设置时默认 24 小时制)]
    clock12hToggle.checked = (await storeApi.get<boolean>('clock12Hour')) === true;
    clock12hToggle.addEventListener('change', async () => {
      const use12Hour = clock12hToggle.checked;
      await storeApi.set('clock12Hour', use12Hour);
      // Broadcast so the kernel digital clock updates live [广播使内核电子时钟即时切换]
      await broadcastApi.notifyClockFormatChanged(use12Hour);
    });
  }
}
