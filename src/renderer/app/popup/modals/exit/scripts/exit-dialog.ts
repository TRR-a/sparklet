// Exit confirm dialog - double-Esc trigger, keyboard navigation, save-before-quit [退出确认弹窗 - 双击 Esc 唤起、键盘导航、退出前保存]
//
// Behavior [行为]：
//   - Press Esc twice quickly (within 600ms) to show the dialog [快速连按两次 Esc 弹出弹窗]
//   - Dialog open: ←/→ switch focus, Enter activates, Esc = return (close) [弹窗中：←/→ 切换焦点、Enter 激活、Esc = 返回 (关闭)]
//   - Default focused button is "Return" so Enter alone never quits [默认焦点在「返回」，单按 Enter 不会退出]
//   - Quit saves all unsaved content (note + project file) before quitting [退出前先保存所有未保存内容 (笔记 + 项目文件)]
//
// Split out [已拆分]：state → exit-dialog-state.ts, lookups/focus → exit-dialog-focus.ts,
// save → exit-dialog-save.ts, actions → exit-dialog-actions.ts,
// keydown → exit-dialog-keydown.ts, binding → exit-dialog-bind.ts.

export { initExitDialog } from './exit-dialog-bind.js';
