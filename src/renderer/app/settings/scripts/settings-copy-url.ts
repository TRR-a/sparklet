// Settings: copy official URL [设置 - 复制官网地址]

import { t } from 'sparklet/renderer/shared/i18n/i18n.js';

/** Bind copy-URL button and input select-on-click [绑定复制官网地址按钮与输入框点选] */
export function bindCopyOfficialUrl(): void {
  // ==================== Copy official URL [复制官网地址] ==========
  const officialUrlInput = document.getElementById('officialUrlInput') as HTMLInputElement | null;
  const copyUrlBtn = document.getElementById('copyUrlBtn');

  async function copyOfficialUrl(): Promise<void> {
    if (!officialUrlInput || !copyUrlBtn) return;
    const url = officialUrlInput.value;
    try {
      await navigator.clipboard.writeText(url);
      copyUrlBtn.textContent = '✅ ' + t('settings.copyUrlSuccess');
      setTimeout(() => { copyUrlBtn.textContent = t('settings.copyUrl'); }, 2000);
    } catch {
      officialUrlInput.select();
      document.execCommand('copy');
      copyUrlBtn.textContent = '✅ ' + t('settings.copyUrlSuccess');
      setTimeout(() => { copyUrlBtn.textContent = t('settings.copyUrl'); }, 2000);
    }
  }

  if (copyUrlBtn) {
    copyUrlBtn.addEventListener('click', copyOfficialUrl);
  }
  if (officialUrlInput) {
    officialUrlInput.addEventListener('click', () => {
      officialUrlInput.select();
    });
  }
}
