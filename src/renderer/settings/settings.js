// src/renderer/settings/settings.js
// Sparklet 设置窗口脚本
// 负责：加载主题、窗口控制、按钮事件、语言切换占位

// ===== 加载主题（从 electronStore 读取，设置到 body 的 data-theme 属性）=====
async function loadTheme() {
    const theme = await window.electronStore.get('theme');
    // 将主题名赋给 body 的自定义属性，CSS 中通过 [data-theme="dark"] 选择器应用暗色样式
    document.body.dataset.theme = theme || 'light';
    // 可选的调试输出
    // console.log('当前主题：', document.body.dataset.theme);
}
document.addEventListener('DOMContentLoaded', loadTheme);

// ===== 窗口控制按钮（与主进程 IPC 通信）=====
// 最小化按钮
document.querySelector('.window-btn.minimize').addEventListener('click', () => {
    window.electronAPI.invoke('window-minimize');
});

// 关闭按钮
document.querySelector('.window-btn.close').addEventListener('click', () => {
    window.electronAPI.invoke('window-close');
});

// ===== 开发者工具按钮（独立窗口模式）=====
// 注意：原代码中有两个重复绑定，已合并为单一事件，调用独立窗口 IPC
document.getElementById('openDevToolsBtn').addEventListener('click', () => {
    window.electronAPI.invoke('open-dev-tools-window');
});

// ===== 关于窗口按钮 =====
document.getElementById('openAboutBtn').addEventListener('click', () => {
    window.electronAPI.invoke('open-about-window');
});

// ===== 语言切换下拉框（占位，仅打印日志，后续实现实际切换）=====
document.getElementById('languageSelect').addEventListener('change', (e) => {
    console.log('语言将切换为：', e.target.value);
    // TODO: 后续实现语言切换逻辑（需主进程支持）
});