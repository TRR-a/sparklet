// src/main/index.js

// 引入 Electron 核心模块：应用管理、窗口创建、主进程通信、菜单模块、外链打开、系统对话框
const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require('electron');
const fs = require('fs-extra');

// 项目官网地址（GitHub 仓库主页）
const PROJECT_OFFICIAL_URL = 'https://github.com/TRR-a/sparklet';
// 引入 Node.js 路径处理模块，用于拼接文件路径
const path = require('path');
// 引入 electron-store，用于本地持久化存储笔记、配置等数据
const Store = require('electron-store');

// ========== 更新模块导入 ==========
// 注意：不要解构 isUpdating / isChecking，因为它们是 getter，解构会丢失动态性
const updaterModule = require('./updater');
const { initUpdater, checkUpdateManually } = updaterModule;
const {
  CACHE_SUCCESS_MARK_DELAY_MS,
  CACHE_RETENTION_MIN_DAYS,
  CACHE_RETENTION_MAX_DAYS,
  DEFAULT_CACHE_SUCCESS_RETENTION_DAYS,
  DEFAULT_CONFIG,
  INTERVAL_OPTIONS
} = require('./updater/constants');
const { getCurrentVersion } = require('./updater/check');
const cacheManager = require('./updater/cache-manager');

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
  return { isUpdating: updaterModule.isUpdating };
});

// （updater:user-response 为旧版自定义对话框遗留代码，已删除，当前使用原生 dialog）

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
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // 延迟 30 秒后，若窗口还没被销毁，则标记该版本「第一次成功打开」
    // （防止秒崩场景误记为成功，导致保留期变短）
    setTimeout(async () => {
      try {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        if (!app.isPackaged) return; // 开发环境不写
        const currentVersion = getCurrentVersion();
        await cacheManager.markSuccessFirstLaunch(`v${currentVersion}`);
      } catch (err) {
        console.warn('[Main] markSuccessFirstLaunch failed (non-critical):', err.message);
      }
    }, CACHE_SUCCESS_MARK_DELAY_MS);
  });
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

// ========== 更新配置IPC ==========
const {
  readConfig,
  writeConfig,
  getConfigItem,
  setConfigItem,
  getCheckInterval,
  getUpdateBehavior
} = require('./updater/config-manager');

// 读取完整配置
ipcMain.handle('updater-config:read', async () => {
  return await readConfig();
});

// 写入完整配置
ipcMain.handle('updater-config:write', async (event, config) => {
  return await writeConfig(config);
});

// 获取单个配置项
ipcMain.handle('updater-config:get', async (event, key) => {
  return await getConfigItem(key);
});

// 设置单个配置项
ipcMain.handle('updater-config:set', async (event, key, value) => {
  return await setConfigItem(key, value);
});

// 获取检查频率
ipcMain.handle('updater-config:getInterval', async () => {
  return await getCheckInterval();
});

// 获取更新行为
ipcMain.handle('updater-config:getBehavior', async () => {
  return await getUpdateBehavior();
});

// 导出当前更新配置为 JSON 文件（用户选择保存路径）
ipcMain.handle('updater-config:export-file', async () => {
  try {
    const cfg = await readConfig();
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
    const defaultName = `sparklet-updater-config-${new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)}.json`;
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: '导出更新配置',
      defaultPath: defaultName,
      filters: [{ name: 'JSON 配置', extensions: ['json'] }]
    });
    if (canceled || !filePath) {
      return { success: true, canceled: true };
    }
    const payload = {
      exportedAt: new Date().toISOString(),
      appVersion: app.getVersion(),
      config: cfg
    };
    await fs.writeJson(filePath, payload, { spaces: 2 });
    return { success: true, filePath };
  } catch (err) {
    console.error('[Main] Export updater config failed:', err);
    return { success: false, error: err.message };
  }
});

// 从 JSON 文件导入更新配置（白名单字段 + 范围校验，避免污染）
ipcMain.handle('updater-config:import-file', async () => {
  const ALLOWED_BEHAVIORS = new Set(['auto', 'notify-only', 'disabled']);
  const LEGAL_INTERVALS = new Set(INTERVAL_OPTIONS.map(o => o.value).concat([0]));
  const WHITE_LIST = new Set(Object.keys(DEFAULT_CONFIG));

  try {
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: '导入更新配置',
      properties: ['openFile'],
      filters: [{ name: 'JSON 配置', extensions: ['json'] }]
    });
    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: true, canceled: true };
    }
    const file = filePaths[0];
    let payload;
    try {
      payload = await fs.readJson(file);
    } catch (parseErr) {
      return { success: false, error: '文件不是合法的 JSON：' + parseErr.message };
    }

    // 兼容裸配置对象（旧版或手动写的）和 { config: ... } 包裹形式
    const raw = payload && payload.config && typeof payload.config === 'object' ? payload.config : (payload || {});
    if (typeof raw !== 'object' || Array.isArray(raw)) {
      return { success: false, error: '配置格式错误，顶层必须是 JSON 对象' };
    }

    // 读取当前配置作为基底，只覆盖白名单字段，并做类型/范围矫正
    const base = await readConfig();
    const merged = { ...base };

    for (const key of Object.keys(raw)) {
      if (!WHITE_LIST.has(key)) continue; // 非白名单字段直接忽略
      const v = raw[key];
      switch (key) {
        case 'updateBehavior':
          if (ALLOWED_BEHAVIORS.has(String(v))) merged[key] = String(v);
          break;
        case 'checkInterval': {
          const n = Number(v);
          if (Number.isFinite(n) && LEGAL_INTERVALS.has(n)) merged[key] = n;
          break;
        }
        case 'autoDownload':
        case 'integrityCheck':
          merged[key] = !!v;
          break;
        case 'cacheRetentionDays': {
          const n = Number(v);
          if (Number.isFinite(n)) {
            merged[key] = Math.max(
              CACHE_RETENTION_MIN_DAYS,
              Math.min(CACHE_RETENTION_MAX_DAYS, Math.round(n))
            );
          }
          break;
        }
        case 'lastCheckTime':
          // lastCheckTime 允许合法 ISO 字符串或 null
          if (v === null || v === undefined) merged[key] = null;
          else {
            const t = new Date(v).getTime();
            if (Number.isFinite(t)) merged[key] = new Date(t).toISOString();
          }
          break;
        default:
          // 其它未知但在白名单内的字段（如果未来新增），直接覆盖仅当类型一致
          if (typeof v === typeof (base[key] ?? v) && !Array.isArray(v)) merged[key] = v;
      }
    }

    await writeConfig(merged);

    // 新策略立即生效：保留天数变化则立刻清理一次过期缓存
    if (typeof merged.cacheRetentionDays === 'number') {
      setImmediate(() => cacheManager.cleanupExpired(merged.cacheRetentionDays).catch(e =>
        console.warn('[Main] Import retention changed, cleanup failed (non-critical):', e.message)
      ));
    }

    return { success: true, config: merged };
  } catch (err) {
    console.error('[Main] Import updater config failed:', err);
    return { success: false, error: err.message };
  }
});

// 手动检查更新
ipcMain.handle('updater:check-now', async () => {
  checkUpdateManually();
  return { started: true };
});

// 获取更新状态（供渲染进程查询）
ipcMain.handle('updater:get-status', async () => {
  return {
    isUpdating: updaterModule.isUpdating,
    isChecking: updaterModule.isChecking,
    updateDisabled: updaterModule.updateDisabled
  };
});

// ========== 开发环境检测 IPC ==========
ipcMain.handle('updater:is-dev', async () => {
  return !app.isPackaged;
});

// ========== 打开项目官网 ==========
ipcMain.handle('app:open-official-site', async () => {
  try {
    await shell.openExternal(PROJECT_OFFICIAL_URL);
    return { success: true };
  } catch (err) {
    console.error('[Main] Open official site failed:', err.message);
    return { success: false, error: err.message };
  }
});

// ========== 打开任意外链（渲染层 dialog 里的 GitHub Releases 链接等）==========
ipcMain.handle('app:open-external', async (_evt, url) => {
  const u = String(url || '').trim();
  if (!u) return { success: false, error: 'empty url' };
  // 简单白名单：只允许 http/https 协议
  if (!/^https?:\/\//i.test(u)) {
    return { success: false, error: 'protocol not allowed' };
  }
  try {
    await shell.openExternal(u);
    return { success: true };
  } catch (err) {
    console.error('[Main] Open external URL failed:', u, err.message);
    return { success: false, error: err.message };
  }
});

// ========== 更新包缓存管理 IPC ==========
// 规范化保留天数：限制在 [MIN, MAX]，非数字兜底默认
function normalizeRetentionDays(days) {
  const n = Number(days);
  if (!Number.isFinite(n)) return DEFAULT_CACHE_SUCCESS_RETENTION_DAYS;
  return Math.max(CACHE_RETENTION_MIN_DAYS, Math.min(CACHE_RETENTION_MAX_DAYS, Math.round(n)));
}

// 获取最新版本缓存信息（设置页展示用）
ipcMain.handle('update-cache:get-info', async () => {
  try {
    let retentionDays = null;
    try {
      retentionDays = await getConfigItem('cacheRetentionDays');
    } catch (_) {}
    const info = await cacheManager.getLatestCacheInfo(retentionDays);
    return { success: true, info };
  } catch (err) {
    console.error('[Main] getUpdateCacheInfo failed:', err.message);
    return { success: false, error: err.message };
  }
});

// 读取「成功打开后保留天数」配置（供设置页回填）
ipcMain.handle('update-cache:get-retention-days', async () => {
  try {
    let days = null;
    try {
      days = await getConfigItem('cacheRetentionDays');
    } catch (_) {}
    return { success: true, days: normalizeRetentionDays(days) };
  } catch (err) {
    console.error('[Main] getRetentionDays failed:', err.message);
    return { success: false, days: DEFAULT_CACHE_SUCCESS_RETENTION_DAYS, error: err.message };
  }
});

// 保存「成功打开后保留天数」配置（范围自动夹到 7~30），保存后立即按新策略跑一次清理
ipcMain.handle('update-cache:set-retention-days', async (_, rawDays) => {
  try {
    const clamped = normalizeRetentionDays(rawDays);
    await setConfigItem('cacheRetentionDays', clamped);
    // 新策略立即生效，清理一次过期的（异步不阻塞返回）
    setImmediate(() => cacheManager.cleanupExpired(clamped).catch(e =>
      console.warn('[Main] Retention changed, cleanup failed (non-critical):', e.message)
    ));
    return { success: true, days: clamped };
  } catch (err) {
    console.error('[Main] setRetentionDays failed:', err.message);
    return { success: false, error: err.message };
  }
});

// 立即清空全部更新包缓存（设置页按钮触发）
ipcMain.handle('update-cache:clear-all', async () => {
  try {
    await cacheManager.clearAllCache();
    return { success: true };
  } catch (err) {
    console.error('[Main] clearUpdateCache failed:', err.message);
    return { success: false, error: err.message };
  }
});

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