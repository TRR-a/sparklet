// settings.js - 设置窗口逻辑
// 说明：处理语言切换、窗口控制、主题同步等设置功能

import { initI18n, loadLanguage, getCurrentLang, t } from '../shared/i18n.js';

// ==================== 初始化 ====================
// 加载主题和初始化多语言系统
async function loadThemeAndI18n() {
    // 从存储加载主题设置
    const theme = await window.electronStore.get('theme');
    document.body.dataset.theme = theme || 'light';

    // 初始化多语言系统
    const currentLang = await initI18n();

    // 同步语言选择下拉框的选中状态
    document.getElementById('languageSelect').value = currentLang;

    // 监听主题切换广播，实时更新设置窗口主题
    window.electronAPI.on('theme-broadcast', (theme) => {
        document.body.dataset.theme = theme;
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', loadThemeAndI18n);

// ==================== 窗口控制 ====================
// 最小化按钮事件
document.querySelector('.window-btn.minimize').addEventListener('click', () => {
    window.electronAPI.invoke('window-minimize');
});

// 关闭按钮事件
document.querySelector('.window-btn.close').addEventListener('click', () => {
    window.electronAPI.invoke('window-close');
});

// ==================== 工具按钮 ====================
// 开发者工具按钮
document.getElementById('openDevToolsBtn').addEventListener('click', () => {
    window.electronAPI.invoke('open-dev-tools-window');
});

// 关于按钮
document.getElementById('openAboutBtn').addEventListener('click', () => {
    window.electronAPI.invoke('open-about-window');
});

// ==================== 语言切换 ====================
// 语言选择下拉框变更事件
document.getElementById('languageSelect').addEventListener('change', async (e) => {
    const newLang = e.target.value;
    const success = await loadLanguage(newLang);

    if (success) {
        // 显示成功提示（支持多语言）
        alert(t('settings.languageChangeSuccess'));
        console.log('语言已切换为：', newLang);
    }
});