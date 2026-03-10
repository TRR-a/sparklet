// src/main/index.js - 完整正确版本（包含无边框、窗口控制、设置窗口关闭事件）
const { app, BrowserWindow, ipcMain, Menu } = require('electron'); // 引入 Menu
const path = require('path');
const Store = require('electron-store');
const fs = require('fs'); // 如果你有文件导入导出，可保留

// 初始化存储
const store = new Store({
  name: 'sparklet-data',
  defaults: { sparkletNotes: [] }
});

ipcMain.handle('store:get', async (event, key) => {
  return store.get(key);
});

ipcMain.handle('store:set', async (event, key, value) => {
  store.set(key, value);
});

// ========== 窗口控制 IPC（任务四）==========
ipcMain.handle('window-minimize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.handle('window-maximize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  }
});

ipcMain.handle('window-close', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

// ========== 开发者工具 IPC（任务二）==========
ipcMain.handle('open-dev-tools', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.webContents.openDevTools();
});

let mainWindow;
let settingsWindow = null; // 设置窗口变量

function createWindow() {
  // 任务二：移除默认菜单
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    icon: path.join(__dirname, '../../assets/icons/icon128.png'),
    // 任务四：无边框，隐藏默认标题栏
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

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// ========== 设置窗口相关（任务一已添加关闭通知，此处整合）==========
function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 400,
    height: 500,
    parent: mainWindow,
    modal: true,
    // 任务四：设置窗口也去掉原生边框，以便自定义控制按钮
    frame: false,
    titleBarStyle: 'hidden',
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
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
    // 通知主窗口设置已关闭（用于任务一移除虚化）
    if (mainWindow) {
      mainWindow.webContents.send('settings-window-closed');
    }
  });
}

ipcMain.handle('open-settings-window', createSettingsWindow);