// src/renderer/settings/settings.js - 多语言完整版
// 引入多语言工具
import { initI18n, loadLanguage, getCurrentLang } from '../shared/i18n.js';

// 加载主题 + 初始化多语言
async function loadThemeAndI18n() {
    const theme = await window.electronStore.get('theme');
    document.body.dataset.theme = theme || 'light';
    // 初始化多语言
    const currentLang = await initI18n();
    // 同步下拉框选中状态
    document.getElementById('languageSelect').value = currentLang;
}

document.addEventListener('DOMContentLoaded', loadThemeAndI18n);

// 窗口控制按钮
// 最小化按钮
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
// 语言切换核心逻辑
document.getElementById('languageSelect').addEventListener('change', async (e) => {
    const newLang = e.target.value;
    await loadLanguage(newLang);
    console.log('语言已切换为：', newLang);
});