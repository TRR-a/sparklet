// Kernel settings window: custom select component [内核设置窗口 - 自定义下拉框组件]
//
// Split out [已拆分]：open/close → welcome-settings-select-open.ts,
// setup → welcome-settings-select-setup.ts, value setter → welcome-settings-select-value.ts.

import { closeAllSelects } from './welcome-settings-select-open.js';

export { setupCustomSelect } from './welcome-settings-select-setup.js';
export { setCustomSelectValue } from './welcome-settings-select-value.js';

// Close dropdowns when clicking outside [点击外部关闭下拉框]
document.addEventListener('click', () => {
  closeAllSelects();
});
