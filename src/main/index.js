// src/main/index.js

// 引入 Electron 核心模块：应用管理、窗口创建、主进程通信、菜单模块、外链打开、系统对话框
const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require('electron');
const fs = require('fs-extra');

// 项目官网地址（GitHub 仓库主页）
const PROJECT_OFFICIAL_URL = 'https://github.com/TRR-a/sparklet';
// 引入 Node.js 路径处理模块，用于拼接文件路径
const path = require('path');
// 引入 electron-store，用于本地持久化存储配置（语言、主题、迁移标记等）
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

// 初始化存储（用于配置和迁移标记）
const store = new Store({
  name: 'sparklet-data',
  defaults: { sparkletNotes: [] }
});

// ========== 🆕 新增：笔记文件系统存储模块 ==========
function getNotesDir() {
  return path.join(app.getPath('userData'), 'notes');
}

async function ensureNotesDir() {
  const dir = getNotesDir();
  await fs.ensureDir(dir);
  return dir;
}

async function migrateFromStore() {
  try {
    const migrated = store.get('fs_migration_done', false);
    if (migrated) {
      console.log('[NotesFS] Migration already done, skipping.');
      return;
    }

    const oldNotes = store.get('sparkletNotes', []);
    console.log('[NotesFS] Found', oldNotes.length, 'notes in old store');

    if (!oldNotes || oldNotes.length === 0) {
      store.set('fs_migration_done', true);
      console.log('[NotesFS] No old notes to migrate, marked done.');
      return;
    }

    const notesDir = await ensureNotesDir();
    console.log('[NotesFS] Notes directory:', notesDir);

    let migratedCount = 0;
    let errorCount = 0;

    for (const note of oldNotes) {
      if (!note || !note.id) {
        console.warn('[NotesFS] Skipping invalid note (missing id):', note);
        continue;
      }

      const jsonPath = path.join(notesDir, `${note.id}.json`);
      const mdPath = path.join(notesDir, `${note.id}.md`);

      // 如果文件已存在则跳过（保护已有文件）
      if (await fs.pathExists(jsonPath) && await fs.pathExists(mdPath)) {
        console.log(`[NotesFS] Skipping existing note: ${note.id}`);
        continue;
      }

      try {
        // 分离内容和元数据
        const { content, ...meta } = note;
        // 确保 meta 中有 id
        meta.id = note.id;

        // 写入元数据
        await fs.writeJson(jsonPath, meta, { spaces: 2 });
        // 写入正文（如果 content 为 null/undefined，写入空字符串）
        await fs.writeFile(mdPath, content || '', 'utf8');

        migratedCount++;
        console.log(`[NotesFS] ✅ Migrated note: ${note.id} (title: "${meta.title || '无标题'}")`);
      } catch (err) {
        errorCount++;
        console.error(`[NotesFS] ❌ Failed to migrate note ${note.id}:`, err.message);
        // 尝试删除可能已创建的不完整文件
        try { await fs.remove(jsonPath); } catch (_) {}
        try { await fs.remove(mdPath); } catch (_) {}
      }
    }

    console.log(`[NotesFS] Migration summary: ${migratedCount} succeeded, ${errorCount} failed`);

    if (errorCount === 0) {
      // 只有全部成功才标记完成
      store.set('fs_migration_done', true);
      console.log('[NotesFS] Migration complete, marked done.');
    } else {
      // 有失败的不标记完成，下次启动会重试
      store.set('fs_migration_done', false);
      console.warn('[NotesFS] Migration had errors, will retry on next startup.');
    }
  } catch (err) {
    console.error('[NotesFS] Migration fatal error:', err);
    store.set('fs_migration_done', false);
  }
}

// ========== 🆕 新增：笔记 IPC 处理器 ==========

// 1. 列出所有笔记（不含 content）
ipcMain.handle('notes:list', async () => {
  try {
    const notesDir = await ensureNotesDir();
    const files = await fs.readdir(notesDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const notes = [];
    for (const file of jsonFiles) {
      const id = file.replace('.json', '');
      const jsonPath = path.join(notesDir, file);
      try {
        const meta = await fs.readJson(jsonPath);
        if (!meta.id) meta.id = id;
        notes.push(meta);
      } catch (e) {
        console.warn(`[NotesFS] Skip invalid json: ${file}`, e.message);
      }
    }

    notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return { success: true, notes };
  } catch (err) {
    console.error('[NotesFS] list error:', err);
    return { success: false, error: err.message };
  }
});

// 2. 获取单篇笔记（含 content）
ipcMain.handle('notes:get', async (event, id) => {
  try {
    if (!id) throw new Error('Note ID required');
    const notesDir = getNotesDir();
    const jsonPath = path.join(notesDir, `${id}.json`);
    const mdPath = path.join(notesDir, `${id}.md`);

    const meta = await fs.readJson(jsonPath);
    let content = '';
    try {
      content = await fs.readFile(mdPath, 'utf8');
    } catch (e) {
      console.warn(`[NotesFS] .md missing for ${id}, treating as empty.`);
    }

    return { success: true, note: { ...meta, content } };
  } catch (err) {
    console.error('[NotesFS] get error:', err);
    return { success: false, error: err.message };
  }
});

// 3. 保存笔记（新建或更新）
ipcMain.handle('notes:save', async (event, noteData) => {
  try {
    if (!noteData || !noteData.id) throw new Error('Invalid note data');
    const notesDir = await ensureNotesDir();
    const { content, ...meta } = noteData;

    const jsonPath = path.join(notesDir, `${noteData.id}.json`);
    await fs.writeJson(jsonPath, meta, { spaces: 2 });

    const mdPath = path.join(notesDir, `${noteData.id}.md`);
    await fs.writeFile(mdPath, content || '', 'utf8');

    return { success: true, note: noteData };
  } catch (err) {
    console.error('[NotesFS] save error:', err);
    return { success: false, error: err.message };
  }
});

// 4. 软删除（移入回收站）
ipcMain.handle('notes:delete', async (event, id) => {
  try {
    if (!id) throw new Error('Note ID required');
    const notesDir = getNotesDir();
    const jsonPath = path.join(notesDir, `${id}.json`);

    const meta = await fs.readJson(jsonPath);
    meta.isDeleted = true;
    meta.deletedAt = new Date().toISOString();
    await fs.writeJson(jsonPath, meta, { spaces: 2 });

    return { success: true };
  } catch (err) {
    console.error('[NotesFS] delete error:', err);
    return { success: false, error: err.message };
  }
});

// 5. 恢复软删除
ipcMain.handle('notes:restore', async (event, id) => {
  try {
    if (!id) throw new Error('Note ID required');
    const notesDir = getNotesDir();
    const jsonPath = path.join(notesDir, `${id}.json`);

    const meta = await fs.readJson(jsonPath);
    meta.isDeleted = false;
    meta.deletedAt = null;
    await fs.writeJson(jsonPath, meta, { spaces: 2 });

    return { success: true };
  } catch (err) {
    console.error('[NotesFS] restore error:', err);
    return { success: false, error: err.message };
  }
});

// 6. 永久删除（物理删除 .json + .md）
ipcMain.handle('notes:permanentDelete', async (event, id) => {
  try {
    if (!id) throw new Error('Note ID required');
    const notesDir = getNotesDir();
    const jsonPath = path.join(notesDir, `${id}.json`);
    const mdPath = path.join(notesDir, `${id}.md`);

    if (await fs.pathExists(jsonPath)) await fs.remove(jsonPath);
    if (await fs.pathExists(mdPath)) await fs.remove(mdPath);

    return { success: true };
  } catch (err) {
    console.error('[NotesFS] permanentDelete error:', err);
    return { success: false, error: err.message };
  }
});

// ========== 原有的存储IPC（保留，用于其他配置） ==========
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

// ========== 更新模块IPC（原有，保留） ==========
ipcMain.handle('updater:check', async () => {
  checkUpdateManually();
  return { started: true };
});

ipcMain.handle('updater:status', async () => {
  return { isUpdating: updaterModule.isUpdating };
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
    const isOverlapping = !(
      settingsBounds.x + settingsBounds.width < mainBounds.x ||
      settingsBounds.x > mainBounds.x + mainBounds.width ||
      settingsBounds.y + settingsBounds.height < mainBounds.y ||
      settingsBounds.y > mainBounds.y + mainBounds.height
    );
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
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    setTimeout(async () => {
      try {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        if (!app.isPackaged) return;
        const currentVersion = getCurrentVersion();
        await cacheManager.markSuccessFirstLaunch(`v${currentVersion}`);
      } catch (err) {
        console.warn('[Main] markSuccessFirstLaunch failed (non-critical):', err.message);
      }
    }, CACHE_SUCCESS_MARK_DELAY_MS);
  });
  mainWindow.on('focus', () => {
    if (settingsWindow && !settingsWindow.isDestroyed() && !settingsWindow.isMinimized()) {
      settingsWindow.moveTop();
    }
  });
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
  settingsWindow.loadFile(path.join(__dirname, '../renderer/modules/note/settings/settings.html'));
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
    syncGlowPosition();
  });
  settingsWindow.on('move', syncGlowPosition);
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

// ========== 关于窗口创建 ==========
function createAboutWindow() {
  if (aboutWindow) {
    aboutWindow.moveTop();
    aboutWindow.focus();
    return;
  }
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
  aboutWindow.once('ready-to-show', () => {
    aboutWindow.show();
    aboutWindow.moveTop();
  });
  aboutWindow.on('closed', () => aboutWindow = null);
}
ipcMain.handle('open-about-window', createAboutWindow);

// ========== 获取应用版本 ==========
ipcMain.handle('app:get-version', () => {
  return app.getVersion();
});

// ========== 更新配置IPC（原有，保留） ==========
const {
  readConfig,
  writeConfig,
  getConfigItem,
  setConfigItem,
  getCheckInterval,
  getUpdateBehavior
} = require('./updater/config-manager');

ipcMain.handle('updater-config:read', async () => {
  return await readConfig();
});
ipcMain.handle('updater-config:write', async (event, config) => {
  return await writeConfig(config);
});
ipcMain.handle('updater-config:get', async (event, key) => {
  return await getConfigItem(key);
});
ipcMain.handle('updater-config:set', async (event, key, value) => {
  return await setConfigItem(key, value);
});
ipcMain.handle('updater-config:getInterval', async () => {
  return await getCheckInterval();
});
ipcMain.handle('updater-config:getBehavior', async () => {
  return await getUpdateBehavior();
});

// 导出配置为 JSON 文件
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

// 导入配置
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

    const raw = payload && payload.config && typeof payload.config === 'object' ? payload.config : (payload || {});
    if (typeof raw !== 'object' || Array.isArray(raw)) {
      return { success: false, error: '配置格式错误，顶层必须是 JSON 对象' };
    }

    const base = await readConfig();
    const merged = { ...base };

    for (const key of Object.keys(raw)) {
      if (!WHITE_LIST.has(key)) continue;
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
          if (v === null || v === undefined) merged[key] = null;
          else {
            const t = new Date(v).getTime();
            if (Number.isFinite(t)) merged[key] = new Date(t).toISOString();
          }
          break;
        default:
          if (typeof v === typeof (base[key] ?? v) && !Array.isArray(v)) merged[key] = v;
      }
    }

    await writeConfig(merged);

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

// 获取更新状态
ipcMain.handle('updater:get-status', async () => {
  return {
    isUpdating: updaterModule.isUpdating,
    isChecking: updaterModule.isChecking,
    updateDisabled: updaterModule.updateDisabled
  };
});

// 开发环境检测
ipcMain.handle('updater:is-dev', async () => {
  return !app.isPackaged;
});

// 打开项目官网
ipcMain.handle('app:open-official-site', async () => {
  try {
    await shell.openExternal(PROJECT_OFFICIAL_URL);
    return { success: true };
  } catch (err) {
    console.error('[Main] Open official site failed:', err.message);
    return { success: false, error: err.message };
  }
});

// 打开任意外链
ipcMain.handle('app:open-external', async (_evt, url) => {
  const u = String(url || '').trim();
  if (!u) return { success: false, error: 'empty url' };
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

// ========== 更新包缓存管理 IPC（原有，保留） ==========
function normalizeRetentionDays(days) {
  const n = Number(days);
  if (!Number.isFinite(n)) return DEFAULT_CACHE_SUCCESS_RETENTION_DAYS;
  return Math.max(CACHE_RETENTION_MIN_DAYS, Math.min(CACHE_RETENTION_MAX_DAYS, Math.round(n)));
}

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

ipcMain.handle('update-cache:set-retention-days', async (_, rawDays) => {
  try {
    const clamped = normalizeRetentionDays(rawDays);
    await setConfigItem('cacheRetentionDays', clamped);
    setImmediate(() => cacheManager.cleanupExpired(clamped).catch(e =>
      console.warn('[Main] Retention changed, cleanup failed (non-critical):', e.message)
    ));
    return { success: true, days: clamped };
  } catch (err) {
    console.error('[Main] setRetentionDays failed:', err.message);
    return { success: false, error: err.message };
  }
});

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
app.whenReady().then(async () => {
  // 🔽 新增：先执行迁移（确保数据落盘）
  await migrateFromStore();

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