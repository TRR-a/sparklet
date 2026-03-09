// src/main/index.js - 完整正确版本
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

// 初始化存储
const store = new Store({
  name: 'sparklet-data',
  defaults: { sparkletNotes: [] }
});

// 处理渲染进程通过预加载脚本发来的存储请求
ipcMain.handle('store:get', async (event, key) => {
  return store.get(key);
});

ipcMain.handle('store:set', async (event, key, value) => {
  store.set(key, value);
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    icon: path.join(__dirname, '../../assets/icons/icon128.png'),
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

// 添加设置窗口变量
let settingsWindow = null;

// 创建设置窗口的函数
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
    webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/index.js')   // 使用同一个预加载脚本
    },
    show: false
});

  settingsWindow.loadFile(path.join(__dirname, '../renderer/settings/settings.html'));

  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// IPC 监听打开设置窗口
ipcMain.handle('open-settings-window', createSettingsWindow);