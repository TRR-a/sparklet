// Welcome: first-launch greeting subtitle [欢迎页 - 首次启动问候语]

import { storeApi } from '../../shared/index.js';

/** First launch: show "Welcome Aboard", otherwise "Welcome back" [首次启动显示欢迎使用，否则显示欢迎回来] */
export async function applyFirstLaunchGreeting(): Promise<void> {
  const welcomed = await storeApi.get<boolean>('welcomed');
  const subtitleEls = document.querySelectorAll('.swiss-subtitle');
  if (!welcomed && subtitleEls.length >= 2) {
    subtitleEls[1].textContent = 'Aboard';
    await storeApi.set('welcomed', true);
  }
}
