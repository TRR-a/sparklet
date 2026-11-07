// Welcome: body-level state events [欢迎页 - 窗口/覆盖状态事件]

import { bus } from '../../shared/index.js';

/** Follow settings-overlap and maximize-state bus events [跟随设置窗口覆盖与最大化状态事件] */
export function bindBodyStateEvents(): void {
  bus.on('welcome-settings-overlap', (overlapping: unknown) => {
    document.body.classList.toggle('blur-background', overlapping === true);
  });
  bus.on('window:maximize-state', (state: unknown) => {
    const maximized = (state as { maximized: boolean }).maximized;
    document.body.classList.toggle('maximized', maximized);
  });
}
