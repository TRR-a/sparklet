// src/renderer/settings/settings.js

// 加载主题（之前已改，保持不变）
async function loadTheme() {
    const theme = await window.electronStore.get('theme');
    document.body.dataset.theme = theme || 'light';
}
document.addEventListener('DOMContentLoaded', loadTheme);

// ===== 任务二：打开开发者工具 =====
document.getElementById('openDevToolsBtn').addEventListener('click', () => {
    window.electronAPI.invoke('open-dev-tools');
});

// ===== 任务四：窗口控制按钮事件 =====
document.querySelector('.window-btn.minimize').addEventListener('click', () => {
    window.electronAPI.invoke('window-minimize');
});

document.querySelector('.window-btn.close').addEventListener('click', () => {
    window.electronAPI.invoke('window-close');
});

// 如果保留原有关闭按钮，可以隐藏它；这里保留注释
// document.getElementById('closeBtn').addEventListener('click', () => {
//     window.close();
// });