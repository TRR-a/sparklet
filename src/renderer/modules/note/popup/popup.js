// popup.js - Sparklet 主弹窗逻辑
// 说明：处理笔记编辑、主题切换、回收站等核心功能

import storageManager from './storage-manager.js';
import { initI18n, t } from '../shared/i18n.js';

// ==================== 全局状态 ====================
let currentNoteId = null; // 当前编辑的笔记 ID
let currentView = 'main'; // 当前视图：'main' 或 'trash'

// ==================== 工具函数 ====================
// 格式化日期显示
function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// 设置主题样式
function setTheme(theme) {
    document.body.dataset.theme = theme;
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        const labelKey = theme === 'dark' ? 'theme.dark' : 'theme.light';
        themeToggleBtn.setAttribute('aria-label', t(labelKey));
    }
}

// 切换主题并保存设置
async function toggleTheme() {
    const currentTheme = document.body.dataset.theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    await window.electronStore.set('theme', newTheme);
    // 通知主进程广播主题切换
    await window.electronAPI.invoke('theme-changed', newTheme);
}

// 更新颜色选择器的活跃状态
function updateActiveColor(color) {
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === color);
    });
}

// ==================== 笔记管理函数 ====================
// 将笔记加载到编辑器中
async function loadNoteIntoEditor(note) {
    if (!note) return;
    currentNoteId = note.id;
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteArea');
    if (titleInput) titleInput.value = note.title || '';
    if (contentInput) contentInput.value = note.content || '';
    updateActiveColor(note.color);
    document.querySelectorAll('.note-list-item').forEach(item => {
        item.classList.toggle('active', item.dataset.noteId === note.id);
    });
}

// 渲染笔记列表
async function renderNoteList(notes) {
    const noteList = document.getElementById('noteList');
    if (!noteList) return;
    noteList.innerHTML = '';
    notes.forEach(note => {
        const li = document.createElement('li');
        li.className = 'note-list-item';
        li.dataset.noteId = note.id;
        if (note.id === currentNoteId) li.classList.add('active');
        li.innerHTML = `
            <span class="note-color-dot" style="background-color: ${note.color};"></span>
            <div class="note-text">
                <div class="note-title">${note.title || t('main.noteUntitled')}</div>
                <div class="note-time">${formatDate(note.updatedAt)}</div>
            </div>
            <button class="note-delete-btn" data-i18n-title="tooltip.deleteNote" title="${t('tooltip.deleteNote')}">🗑️</button>
        `;
        li.addEventListener('click', (e) => {
            if (!e.target.classList.contains('note-delete-btn')) switchNote(note.id);
        });
        const deleteBtn = li.querySelector('.note-delete-btn');
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await handleDeleteNote(note.id, li);
        });
        noteList.appendChild(li);
    });
}

// 切换到指定笔记
async function switchNote(noteId) {
    await saveCurrentNote();
    const note = await storageManager.getNoteById(noteId);
    if (note) await loadNoteIntoEditor(note);
}

// 防抖保存当前笔记
let saveTimeout;
async function saveCurrentNote() {
    if (!currentNoteId) return;
    clearTimeout(saveTimeout);
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteArea');
    if (!titleInput || !contentInput) return;
    const title = titleInput.value.trim();
    const content = contentInput.value;
    const finalTitle = title || content.substring(0, 20) || t('main.noteUntitled');
    await storageManager.updateNote(currentNoteId, { title: finalTitle, content });
    const notes = await storageManager.getNotes();
    await renderNoteList(notes);
}

// 延迟保存函数
function debounceSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveCurrentNote, 800);
}

// 创建新笔记
async function createNewNote() {
    const newNote = await storageManager.createNote(t('main.noteUntitled'));
    const notes = await storageManager.getNotes();
    await renderNoteList(notes);
    await loadNoteIntoEditor(newNote);
    const titleInput = document.getElementById('noteTitle');
    if (titleInput) {
        titleInput.focus();
        titleInput.select();
    }
}

// 更改笔记颜色
async function changeNoteColor(color) {
    if (!currentNoteId) return;
    await storageManager.updateNote(currentNoteId, { color });
    updateActiveColor(color);
    const notes = await storageManager.getNotes();
    await renderNoteList(notes);
}

// ==================== 删除功能 ====================
// 处理笔记删除（支持撤销）
async function handleDeleteNote(noteId, listItemElement) {
    if (listItemElement.classList.contains('deleting')) {
        const success = await storageManager.deleteNote(noteId);
        if (!success) return;
        const activeNotes = await storageManager.getNotes();
        await renderNoteList(activeNotes);
        if (noteId === currentNoteId) {
            if (activeNotes.length > 0) {
                const firstNote = activeNotes[0];
                currentNoteId = firstNote.id;
                await loadNoteIntoEditor(firstNote);
            } else {
                const newNote = await storageManager.createNote(t('main.noteUntitled'));
                currentNoteId = newNote.id;
                await loadNoteIntoEditor(newNote);
            }
        }
    } else {
        listItemElement.classList.add('deleting');
        setTimeout(() => {
            if (listItemElement.classList.contains('deleting')) {
                listItemElement.classList.remove('deleting');
            }
        }, 3000);
    }
}

// ==================== 回收站功能 ====================
// 切换回收站视图
async function toggleTrashView() {
    const trashToggleBtn = document.getElementById('trashToggle');
    const newNoteBtn = document.getElementById('newNoteBtn');
    const noteTitleInput = document.getElementById('noteTitle');
    const noteEditor = document.getElementById('noteArea');
    if (currentView === 'main') {
        currentView = 'trash';
        document.body.classList.add('trash-view');
        trashToggleBtn.style.opacity = '1';
        trashToggleBtn.style.color = '#ea4335';
        if (newNoteBtn) newNoteBtn.style.display = 'none';
        if (noteTitleInput) noteTitleInput.style.display = 'none';
        if (noteEditor) noteEditor.style.display = 'none';
        await renderTrashList();
    } else {
        currentView = 'main';
        document.body.classList.remove('trash-view');
        trashToggleBtn.style.opacity = '0.7';
        trashToggleBtn.style.color = '';
        if (newNoteBtn) newNoteBtn.style.display = 'block';
        if (noteTitleInput) noteTitleInput.style.display = 'block';
        if (noteEditor) noteEditor.style.display = 'block';
        await loadNotes();
    }
}

// 渲染回收站笔记列表
async function renderTrashList() {
    const trashedNotes = await storageManager.getTrashNotes();
    const noteList = document.getElementById('noteList');
    if (!noteList) return;
    noteList.innerHTML = '';
    trashedNotes.forEach(note => {
        const li = document.createElement('li');
        li.className = 'note-list-item';
        li.innerHTML = `
            <span class="note-color-dot" style="background-color: ${note.color};"></span>
            <div class="note-text">
                <div class="note-title">${note.title || t('main.noteUntitled')}</div>
                <div class="note-time">${t('main.noteDeletedAt')} ${new Date(note.deletedAt).toLocaleString()}</div>
            </div>
            <div class="trash-actions">
                <button class="restore-btn" data-note-id="${note.id}">${t('main.btnRestore')}</button>
                <button class="permanent-delete-btn" data-note-id="${note.id}">${t('main.btnPermanentDelete')}</button>
            </div>
        `;
        noteList.appendChild(li);
    });
    document.querySelectorAll('.restore-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await restoreFromTrash(e.target.dataset.noteId);
        });
    });
    document.querySelectorAll('.permanent-delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await permanentlyDeleteNote(e.target.dataset.noteId);
        });
    });
}

// 从回收站还原笔记
async function restoreFromTrash(noteId) {
    const success = await storageManager.restoreNote(noteId);
    if (success) await renderTrashList();
}

// 永久删除笔记
async function permanentlyDeleteNote(noteId) {
    if (!confirm(t('main.confirmPermanentDelete'))) return;
    const success = await storageManager.permanentlyDeleteNote(noteId);
    if (success) await renderTrashList();
}

// ==================== 初始化 ====================
// 加载笔记数据
async function loadNotes() {
    await storageManager.init();
    const notes = await storageManager.getNotes();
    if (notes.length === 0) {
        const newNote = await storageManager.createNote(t('main.noteUntitled'));
        currentNoteId = newNote.id;
        await renderNoteList([newNote]);
        await loadNoteIntoEditor(newNote);
    } else {
        await renderNoteList(notes);
        currentNoteId = notes[0].id;
        await loadNoteIntoEditor(notes[0]);
    }
}

// 应用初始化
async function initApp() {
    console.log('Sparklet 初始化...');
    await storageManager.init();
    await initI18n();
    const theme = await window.electronStore.get('theme');
    setTheme(theme || 'light');
    bindEvents();
    await loadNotes();
    // 监听文件篡改检测
    window.electronAPI.on('integrity:tamper-detected', (data) => {
        showIntegrityAlert(data);
    });

    // 监听更新可用
    window.electronAPI.on('update:available', (data) => {
        showUpdateAlert(data);
    });

    // 监听下载进度
    window.electronAPI.on('update:download-progress', (data) => {
        showDownloadProgress(data.progress);
    });

    // 监听下载完成
    window.electronAPI.on('update:download-complete', () => {
        showDownloadComplete();
    });

    // 监听更新错误
    window.electronAPI.on('update:error', (data) => {
        alert(`更新失败: ${data.error}`);
    });
    console.log('Sparklet 初始化完成');
}

// 绑定事件监听器
function bindEvents() {
    // 主题切换按钮
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

    // 回收站切换按钮
    const trashToggleBtn = document.getElementById('trashToggle');
    if (trashToggleBtn) trashToggleBtn.addEventListener('click', toggleTrashView);

    // 设置按钮
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', async () => {
            document.body.classList.add('blur-background');
            document.getElementById('settingsGlowMask').classList.add('show');
            await window.electronAPI.invoke('open-settings-window');
        });
    }

    // 窗口控制按钮
    const minimizeBtn = document.querySelector('.window-btn.minimize');
    const maximizeBtn = document.querySelector('.window-btn.maximize');
    const closeBtn = document.querySelector('.window-btn.close');
    if (minimizeBtn) minimizeBtn.addEventListener('click', () => window.electronAPI.invoke('window-minimize'));
    if (maximizeBtn) maximizeBtn.addEventListener('click', () => window.electronAPI.invoke('window-maximize'));
    if (closeBtn) closeBtn.addEventListener('click', () => window.electronAPI.invoke('window-close'));

    // 新建笔记按钮
    const newNoteBtn = document.getElementById('newNoteBtn');
    if (newNoteBtn) newNoteBtn.addEventListener('click', createNewNote);

    // 颜色选择器
    const colorPalette = document.querySelectorAll('.color-option');
    colorPalette.forEach(btn => {
        btn.addEventListener('click', () => changeNoteColor(btn.dataset.color));
    });

    // 输入框自动保存
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteArea');
    if (titleInput) titleInput.addEventListener('input', debounceSave);
    if (contentInput) contentInput.addEventListener('input', debounceSave);

    // 窗口失焦时保存
    window.addEventListener('blur', saveCurrentNote);

    // 设置窗口光晕位置同步
    window.electronAPI.on('settings-window-moved', ({ mainBounds, settingsBounds }) => {
        const glowMask = document.getElementById('settingsGlowMask');
        const relativeLeft = settingsBounds.x - mainBounds.x;
        const relativeTop = settingsBounds.y - mainBounds.y;
        glowMask.style.left = `${relativeLeft}px`;
        glowMask.style.top = `${relativeTop}px`;
        glowMask.style.width = `${settingsBounds.width}px`;
        glowMask.style.height = `${settingsBounds.height}px`;
    });

    // 监听设置窗口重叠状态，控制背景虚化
    window.electronAPI.on('settings-window-overlap', (isOverlapping) => {
        const glowMask = document.getElementById('settingsGlowMask');
        if (isOverlapping) {
            document.body.classList.add('blur-background');
            glowMask.classList.add('show');
        } else {
            document.body.classList.remove('blur-background');
            glowMask.classList.remove('show');
        }
    });
}

// ==================== DOM加载完成 ====================
// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

// 调试函数
window.debugStorage = () => storageManager.debug();

// ==================== 窗口状态监听 ====================
// 设置窗口关闭时清理状态
window.electronAPI.on('settings-window-closed', () => {
    document.body.classList.remove('blur-background');
    document.getElementById('settingsGlowMask').classList.remove('show');
});

// 设置窗口最小化时清理状态
window.electronAPI.on('settings-window-minimized', () => {
    document.body.classList.remove('blur-background');
    document.getElementById('settingsGlowMask').classList.remove('show');
});

// 设置窗口恢复时重新显示光晕
window.electronAPI.on('settings-window-restored', () => {
    document.body.classList.add('blur-background');
    document.getElementById('settingsGlowMask').classList.add('show');
});

// ==================== 文件校验弹窗 ====================
function showIntegrityAlert(data) {
  const message = `检测到文件损坏或篡改！\n\n损坏文件: ${data.corruptedFiles.length}个\n缺失文件: ${data.missingFiles.length}个\n\n建议立即更新修复。`;
  
  const result = confirm(message + '\n\n是否立即更新修复？');
  if (result) {
    window.electronAPI.invoke('integrity:handle-strategy', 'immediate');
  } else {
    // 显示策略选择
    const strategy = prompt('请选择提醒时间：\n1. 30分钟后\n2. 1小时后\n3. 2小时后\n4. 1天后\n5. 重启时提醒\n6. 永久不提醒', '5');
    
    const strategyMap = {
      '1': 'delay_30min',
      '2': 'delay_1h',
      '3': 'delay_2h',
      '4': 'delay_1d',
      '5': 'on_restart',
      '6': 'never'
    };
    
    window.electronAPI.invoke('integrity:handle-strategy', strategyMap[strategy] || 'on_restart');
  }
}

// ==================== 更新弹窗 ====================
function showUpdateAlert(data) {
  const message = `发现新版本 ${data.latestVersion}！\n当前版本: ${data.currentVersion}\n\n${data.releaseNotes || '修复了一些问题，提升了稳定性。'}\n\n是否立即更新？`;
  
  const result = confirm(message);
  if (result) {
    window.electronAPI.invoke('update:handle-strategy', 'immediate', data);
  } else {
    // 显示策略选择
    const strategy = prompt('请选择提醒时间：\n1. 30分钟后\n2. 1小时后\n3. 2小时后\n4. 1天后\n5. 重启时提醒\n6. 永久不提醒', '5');
    
    const strategyMap = {
      '1': 'delay_30min',
      '2': 'delay_1h',
      '3': 'delay_2h',
      '4': 'delay_1d',
      '5': 'on_restart',
      '6': 'never'
    };
    
    window.electronAPI.invoke('update:handle-strategy', strategyMap[strategy] || 'on_restart', data);
  }
}

// ==================== 下载进度弹窗 ====================
function showDownloadProgress(progress) {
  console.log(`下载进度: ${progress}%`);
  // 后续可以替换为美观的进度条弹窗
}

// ==================== 下载完成弹窗 ====================
function showDownloadComplete() {
  alert('更新包下载完成，即将重启应用进行更新。');
}