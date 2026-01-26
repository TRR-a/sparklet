// src/main/index.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    icon: path.join(__dirname, '../../assets/icons/icon128.png'), // 指向图标
    webPreferences: {
      nodeIntegration: false, // 安全性：禁止渲染进程直接使用Node.js
      contextIsolation: true, // 安全性：开启上下文隔离
      preload: path.join(__dirname, '../preload/index.js') // 预加载脚本（我们稍后创建）
    },
    show: false // 先不显示，加载完成后再显示以避免白屏
  });

  // 加载渲染进程的界面（你原来的popup.html）
  mainWindow.loadFile(path.join(__dirname, '../renderer/popup/popup.html'));

  // 页面加载完成后显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 当窗口关闭时，释放窗口对象
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Electron初始化完成后调用
app.whenReady().then(createWindow);

// 所有窗口关闭时退出应用（macOS除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// macOS点击dock图标时重新创建窗口
app.on('activate', () => {
  if (mainWindow === null) createWindow();
});