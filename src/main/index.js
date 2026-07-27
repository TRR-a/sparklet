// src/main/index.js

// 引入 Electron 核心模块：应用管理、窗口创建、主进程通信、菜单模块
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
// 引入 Node.js 路径处理模块，用于拼接文件路径
const path = require('path');
// 引入 electron-store，用于本地持久化存储笔记、配置等数据
const Store = require('electron-store');

// ========== 更新模块导入 ==========
const { initUpdater, checkUpdateManually, isUpdating } = require('./updater');

// ========== 全局窗口变量 ==========
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

// ========== 主题切换广播IPC ==========
ipcMain.handle('theme-changed', (event, theme) => {
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) win.webContents.send('theme-broadcast', theme);
  });
});

// ========== 更新模块IPC ==========
ipcMain.handle('updater:check', async () => {
  checkUpdateManually();
  return { started: true };
});

ipcMain.handle('updater:status', async () => {
  return { isUpdating: isUpdating };
});

// 监听用户对更新对话框的响应（转发给更新模块）
ipcMain.on('updater:user-response', (event, response) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.webContents.emit('updater:user-response', event, response);
  }
});

// ========== 光晕位置同步函数 ==========
function syncGlowPosition() {
  if (
    mainWindow && !mainWindow.isDestroyed() &&
    settingsWindow && !settingsWindow.isDestroyed()
  ) {
    const mainBounds = mainWindow.getBounds();
    const settingsBounds = settingsWindow.getBounds();
    mainWindow.webContents.send('settings-window-moved', { mainBounds, settingsBounds });
    //检测设置窗口是否与主窗口有重叠
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
  mainWindow.loadFile(path.join(__dirname, '../renderer/modules/note/popup/popup.html'));
  // 窗口渲染就绪后再显示，避免启动白屏闪烁
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
  // 监听主窗口关闭事件，窗口完全关闭时触发
  // 将窗口对象置为null，解除引用防止内存泄漏
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
  // 创建设置窗口实例（无边框透明样式，固定尺寸）
  settingsWindow = new BrowserWindow({
    // 窗口宽度
    width: 400,
     // 窗口高度
    height: 500,
    // 禁用系统默认窗口边框
    frame: false,
    // 隐藏系统标题栏
    titleBarStyle: 'hidden',
    // 开启窗口透明效果
    transparent: true,
    // 关闭窗口阴影
    hasShadow: false,
    // 禁止用户缩放窗口
    resizable: false,
    webPreferences: {
      // 关闭Node集成，保障安全
      nodeIntegration: false,
      // 开启上下文隔离，保障安全
      contextIsolation: true,
      // 预加载脚本
      preload: path.join(__dirname, '../preload/index.js')
    },
    // 初始隐藏窗口，避免白屏闪烁
    show: false
  });
  settingsWindow.loadFile(path.join(__dirname, '../renderer/modules/note/settings/settings.html'));
  // 监听设置窗口加载完成事件，避免白屏闪烁
  settingsWindow.once('ready-to-show', () => {
    // 显示设置窗口
    settingsWindow.show();
    // 执行同步发光元素位置的函数，确保打开时位置正确
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

// ========== 关于窗口创建，关于窗口在设置窗口上面，且不锁死设置面板 ==========
function createAboutWindow() {
  if (aboutWindow) {
    // 已存在则直接置顶
    aboutWindow.moveTop(); 
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
  aboutWindow.loadFile(path.join(__dirname, '../renderer/modules/note/about/about.html'));
  // 监听关于窗口就绪事件，就绪后显示窗口并置顶，不干扰其他窗口
  aboutWindow.once('ready-to-show', () => {
    aboutWindow.show();
    // 仅将关于窗口置顶，不再触发设置窗口置顶 / 唤回
    aboutWindow.moveTop();
  });
  aboutWindow.on('closed', () => aboutWindow = null);
}
ipcMain.handle('open-about-window', createAboutWindow);

// ========== 应用生命周期 ==========
app.whenReady().then(() => {
  // 创建主窗口
  createWindow();
  
  // 初始化更新模块（窗口创建后执行）
  initUpdater();
  
  // 延迟 3 秒后自动检查更新（不阻塞启动）
  setTimeout(() => {
    checkUpdateManually();
  }, 3000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (mainWindow === null) createWindow();
});