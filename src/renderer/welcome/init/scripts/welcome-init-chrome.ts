// Welcome: theme + window/panel wiring [欢迎页 - 主题与窗口/面板接线]

import { bindWindowControls } from '../../shell/scripts/welcome-window-controls.js';
import { bindWelcomeSettings } from '../../shell/scripts/welcome-more-menu.js';
import { bindKernelExitDialog } from '../../exit/scripts/welcome-exit-dialog.js';
import { loadTheme, bindThemeBroadcast } from '../../scripts/welcome-theme.js';

/** Load the theme and wire header controls, settings and exit dialog [加载主题并接线头部控件、设置与退出弹窗] */
export async function bindWelcomeChrome(): Promise<void> {
  await loadTheme();
  bindThemeBroadcast();

  bindWindowControls();
  bindWelcomeSettings();
  bindKernelExitDialog();
}
