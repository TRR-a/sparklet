async function loadTheme() {
    const theme = await window.electronStore.get('theme');
    document.body.dataset.theme = theme || 'light';
}
document.addEventListener('DOMContentLoaded', loadTheme);

document.querySelector('.window-btn.close').addEventListener('click', () => {
    window.close();
});