// 引入多语言工具
import { initI18n } from '../shared/i18n.js';

// 加载主题 + 初始化多语言
async function loadThemeAndI18n() {
    const theme = await window.electronStore.get('theme');
    document.body.dataset.theme = theme || 'light';
    // 初始化多语言
    await initI18n();

    // 新增：监听主题切换广播
    window.electronAPI.on('theme-broadcast', (theme) => {
        document.body.dataset.theme = theme;
    });
}

document.addEventListener('DOMContentLoaded', loadThemeAndI18n);

// 关闭按钮
document.querySelector('.window-btn.close').addEventListener('click', () => {
    window.close();
});