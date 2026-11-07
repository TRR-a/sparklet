// Welcome: language bootstrap + live follow [欢迎页 - 语言初始化与实时跟随]

import { storeApi, broadcastApi, initCustomTooltip } from '../../shared/index.js';
import { t, applyI18n, setLang } from './welcome-i18n.js';
import { refreshMonitor } from './welcome-monitor.js';

/** Read the saved language, apply it, and follow settings broadcasts [读取已存语言并应用，随后跟随设置广播] */
export async function initLanguage(): Promise<void> {
  const saved = await storeApi.get<string>('language');
  setLang(saved);
  applyI18n();
  initCustomTooltip((key) => t(key));

  // Language: live-follow settings changes [语言：实时跟随设置变更]
  broadcastApi.onLanguageBroadcast((lang: unknown) => {
    setLang(lang);
    applyI18n();
    // Re-render dynamic content [重新渲染动态内容]
    void refreshMonitor();
  });
}
