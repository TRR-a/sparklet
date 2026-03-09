// 获取主题并应用到 body 的类
async function loadTheme() {
    const theme = await window.electronStore.get('theme');
    document.body.className = theme || 'light';   // 默认为 'light'
}

document.addEventListener('DOMContentLoaded', loadTheme);

document.getElementById('closeBtn').addEventListener('click', () => {
    window.close();
});