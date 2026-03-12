// src/renderer/settings/settings.js

// 加载主题
async function loadTheme() {
    const theme = await window.electronStore.get('theme');
    document.body.dataset.theme = theme || 'light';
}
document.addEventListener('DOMContentLoaded', loadTheme);

// 窗口控制按钮
document.querySelector('.window-btn.minimize').addEventListener('click', () => {
    window.electronAPI.invoke('window-minimize');
});

document.querySelector('.window-btn.close').addEventListener('click', () => {
    window.electronAPI.invoke('window-close');
});

// 打开开发者工具（独立窗口，以后可以扩展为单独弹窗）
document.getElementById('openDevToolsBtn').addEventListener('click', () => {
    window.electronAPI.invoke('open-dev-tools');
});

// 打开关于窗口
document.getElementById('openAboutBtn').addEventListener('click', () => {
    window.electronAPI.invoke('open-about-window');
});

// 打开开发者工具窗口（独立窗口模式）
document.getElementById('openDevToolsBtn').addEventListener('click', () => {
    window.electronAPI.invoke('open-dev-tools-window');
});

// 语言切换占位（仅控制台打印）
document.getElementById('languageSelect').addEventListener('change', (e) => {
    console.log('语言将切换为：', e.target.value);
    // TODO: 后续实现实际语言切换
});