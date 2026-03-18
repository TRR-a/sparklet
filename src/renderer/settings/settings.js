// src/renderer/settings/settings.js

// 加载主题
async function loadTheme() {
    const theme = await window.electronStore.get('theme');
    document.body.dataset.theme = theme || 'light';
}
document.addEventListener('DOMContentLoaded', loadTheme);

// 窗口控制按钮
// 最小化按钮改为隐藏窗口（不透明度消失）
document.querySelector('.window-btn.minimize').addEventListener('click', () => {
    window.electronAPI.invoke('window-minimize');
});

// 关闭按钮
document.querySelector('.window-btn.close').addEventListener('click', () => {
    window.electronAPI.invoke('window-close');
});

// 开发者工具按钮（独立窗口）
document.getElementById('openDevToolsBtn').addEventListener('click', () => {
    window.electronAPI.invoke('open-dev-tools-window');
});

// 关于按钮
document.getElementById('openAboutBtn').addEventListener('click', () => {
    window.electronAPI.invoke('open-about-window');
});

// 语言切换占位
document.getElementById('languageSelect').addEventListener('change', (e) => {
    console.log('语言将切换为：', e.target.value);
});