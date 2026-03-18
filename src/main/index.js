// src/main/index.js - 完整正确版本（包含无边框、窗口控制、设置窗口关闭事件）
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fs = require('fs');

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

// ========== 窗口控制 IPC ==========
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

// ========== 开发者工具 IPC ==========
ipcMain.handle('open-dev-tools', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.webContents.openDevTools();
});

let mainWindow;
let settingsWindow = null;

function createWindow() {
  // 移除默认菜单
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    icon: path.join(__dirname, '../../assets/icons/icon128.png'),
    // 无边框，隐藏默认标题栏（跨平台统一风格）
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

// ========== 设置窗口相关 ==========
function createSettingsWindow() {
  if (settingsWindow) {
    // 如果窗口已存在，检查是否最小化，若是则先还原
    if (settingsWindow.isMinimized()) {
      settingsWindow.restore();
    }
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 400,
    height: 500,
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

  // 监听最小化事件：通知主窗口取消虚化
  settingsWindow.on('minimize', () => {
    if (mainWindow) {
      mainWindow.webContents.send('settings-window-minimized');
    }
  });

  // 监听恢复事件（从任务栏恢复）：通知主窗口重新虚化
  settingsWindow.on('restore', () => {
    if (mainWindow) {
      mainWindow.webContents.send('settings-window-restored');
    }
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
    if (mainWindow) {
      mainWindow.webContents.send('settings-window-closed');
    }
  });
}

ipcMain.handle('open-settings-window', createSettingsWindow);

// ===== 关于窗口（独立，无父窗口）=====
let aboutWindow = null;

function createAboutWindow() {
    if (aboutWindow) {
        aboutWindow.focus();
        return;
    }

    aboutWindow = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '../preload/index.js')
        },
        // 不设置 parent，使窗口独立
        show: false
    });

    aboutWindow.loadFile(path.join(__dirname, '../renderer/about/about.html'));

    aboutWindow.once('ready-to-show', () => {
        aboutWindow.show();
    });

    aboutWindow.on('closed', () => {
        aboutWindow = null;
    });
}

ipcMain.handle('open-about-window', createAboutWindow);

// ===== 开发者工具窗口（独立窗口模式）=====
ipcMain.handle('open-dev-tools-window', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.webContents.openDevTools({ mode: 'detach' }); // 独立窗口模式
});