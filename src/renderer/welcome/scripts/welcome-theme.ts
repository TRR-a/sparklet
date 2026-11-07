// Welcome theme application [欢迎页主题应用]

import { storeApi, broadcastApi } from '../../shared/index.js';

// ========== Theme [主题] ==========
export async function loadTheme(): Promise<void> {
  const theme = await storeApi.get<string>('theme');
  document.body.dataset.theme = theme || 'light';
}

export function bindThemeBroadcast(): void {
  broadcastApi.onThemeBroadcast((theme: unknown) => {
    document.body.dataset.theme = (theme as string) || 'light';
  });
}
