// Sparklet 扩展的后台服务脚本 (Service Worker)
console.log('🎉 Sparklet 后台脚本已成功加载！');

// 监听扩展安装事件
chrome.runtime.onInstalled.addListener(() => {
    console.log('✅ Sparklet 扩展已完成安装或更新。');
    // 这里可以放置安装后的初始化逻辑，例如初始化存储空间
});

// 在这里可以添加其他事件监听器，例如接收来自弹出窗口的消息
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { ... });