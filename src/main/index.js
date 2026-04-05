// src/main/index.js - 完整修复版（主窗口拖动+窗口锁死修复+设置窗口重叠检测）
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
// ========== 全局窗口变量（统一作用域）==========
let mainWindow = null;
let settingsWindow = null;
let aboutWindow = null;
// 初始化存储
const store = new Store({
  name: 'sparklet-data',
  defaults: { sparkletNotes: [] }
});
// ========== 存储IPC ==========
ipcMain.handle('store:get', async (event, key) => store.get(key));
ipcMain.handle('store:set', async (event, key, value) => store.set(key, value));
// ========== 窗口控制IPC ==========
ipcMain.handle('window-minimize', () => BrowserWindow.getFocusedWindow()?.minimize());
ipcMain.handle('window-maximize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.handle('window-close', () => BrowserWindow.getFocusedWindow()?.close());
// ========== 开发者工具IPC ==========
ipcMain.handle('open-dev-tools', () => BrowserWindow.getFocusedWindow()?.webContents.openDevTools());
ipcMain.handle('open-dev-tools-window', () => {
  BrowserWindow.getFocusedWindow()?.webContents.openDevTools({ mode: 'detach' });
});
// ========== 多语言广播IPC ==========
ipcMain.handle('language-changed', (event, lang) => {
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) win.webContents.send('language-broadcast', lang);
  });
});

// ========== 新增：主题切换广播IPC ==========
ipcMain.handle('theme-changed', (event, theme) => {
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) win.webContents.send('theme-broadcast', theme);
  });
});

// ========== 光晕位置同步函数（新增窗口重叠检测）==========
function syncGlowPosition() {
  if (
    mainWindow && !mainWindow.isDestroyed() &&
    settingsWindow && !settingsWindow.isDestroyed()
  ) {
    const mainBounds = mainWindow.getBounds();
    const settingsBounds = settingsWindow.getBounds();
    mainWindow.webContents.send('settings-window-moved', { mainBounds, settingsBounds });

    // 新增：检测设置窗口是否与主窗口有重叠
    const isOverlapping = !(
      settingsBounds.x + settingsBounds.width < mainBounds.x ||
      settingsBounds.x > mainBounds.x + mainBounds.width ||
      settingsBounds.y + settingsBounds.height < mainBounds.y ||
      settingsBounds.y > mainBounds.y + mainBounds.height
    );

    // 发送重叠状态给主窗口
    mainWindow.webContents.send('settings-window-overlap', isOverlapping);
  }
}
// ========== 主窗口创建 ==========
function createWindow() {
  Menu.setApplicationMenu(null);
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    icon: path.join(__dirname, '../../assets/icons/icon128.png'),
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js')
    },
    show: false
  });
  mainWindow.loadFile(path.join(__dirname, '../renderer/popup/popup.html'));
  
  mainWindow.once('ready-to-show', () => mainWindow.show());
  
  // 主窗口焦点时，保证设置窗口在上层
  mainWindow.on('focus', () => {
    if (settingsWindow && !settingsWindow.isDestroyed() && !settingsWindow.isMinimized()) {
      settingsWindow.moveTop();
    }
  });
  // 主窗口移动/缩放时，同步光晕位置
  mainWindow.on('move', syncGlowPosition);
  mainWindow.on('resize', syncGlowPosition);
  
  mainWindow.on('closed', () => mainWindow = null);
}
// ========== 设置窗口创建 ==========
function createSettingsWindow() {
  if (settingsWindow) {
    if (settingsWindow.isMinimized()) settingsWindow.restore();
    settingsWindow.moveTop();
    settingsWindow.focus();
    return;
  }
  settingsWindow = new BrowserWindow({
    width: 400,
    height: 500,
    frame: false,
    titleBarStyle: 'hidden',
    transparent: true,
    hasShadow: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js')
    },
    show: false
  });
  settingsWindow.loadFile(path.join(__dirname, '../renderer/settings/settings.html'));
  
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
    syncGlowPosition();
  });
  // 设置窗口移动时，同步光晕位置
  settingsWindow.on('move', syncGlowPosition);
  // 窗口状态事件
  settingsWindow.on('minimize', () => {
    mainWindow?.webContents.send('settings-window-minimized');
  });
  settingsWindow.on('restore', () => {
    mainWindow?.webContents.send('settings-window-restored');
    syncGlowPosition();
  });
  settingsWindow.on('closed', () => {
    settingsWindow = null;
    mainWindow?.webContents.send('settings-window-closed');
  });
}
ipcMain.handle('open-settings-window', createSettingsWindow);
// ========== 关于窗口创建（修复层级：关于窗口在设置窗口上面，且不锁死设置面板）==========
function createAboutWindow() {
  if (aboutWindow) {
    aboutWindow.moveTop(); // 已存在则直接置顶
    aboutWindow.focus();
    return;
  }
  // 不设parent，彻底避免锁死设置窗口
  aboutWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    titleBarStyle: 'hidden',
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js')
    },
    show: false
  });
  aboutWindow.loadFile(path.join(__dirname, '../renderer/about/about.html'));
  
  aboutWindow.once('ready-to-show', () => {
    aboutWindow.show();
    // 核心修复：只把关于窗口置顶，不再把设置窗口拉回来
    aboutWindow.moveTop();
  });
  aboutWindow.on('closed', () => aboutWindow = null);
}
ipcMain.handle('open-about-window', createAboutWindow);
// ========== 应用生命周期 ==========
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (mainWindow === null) createWindow();
});