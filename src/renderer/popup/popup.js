// popup.js - Sparklet 主逻辑（完整修复版）
import storageManager from './storage-manager.js';
import { initI18n, t } from '../shared/i18n.js';

// ==================== 全局状态 ====================
let currentNoteId = null;
let currentView = 'main';

// ==================== 工具函数 ====================
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

function setTheme(theme) {
    document.body.dataset.theme = theme;
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        const labelKey = theme === 'dark' ? 'theme.dark' : 'theme.light';
        themeToggleBtn.setAttribute('aria-label', t(labelKey));
    }
}

async function toggleTheme() {
    const currentTheme = document.body.dataset.theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    await window.electronStore.set('theme', newTheme);
    // 新增：通知主进程广播主题切换
    await window.electronAPI.invoke('theme-changed', newTheme);
}

function updateActiveColor(color) {
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === color);
    });
}

// ==================== 笔记管理函数 ====================
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

async function switchNote(noteId) {
    await saveCurrentNote();
    const note = await storageManager.getNoteById(noteId);
    if (note) await loadNoteIntoEditor(note);
}

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

function debounceSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveCurrentNote, 800);
}

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

async function changeNoteColor(color) {
    if (!currentNoteId) return;
    await storageManager.updateNote(currentNoteId, { color });
    updateActiveColor(color);
    const notes = await storageManager.getNotes();
    await renderNoteList(notes);
}

// ==================== 删除功能 ====================
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

async function restoreFromTrash(noteId) {
    const success = await storageManager.restoreNote(noteId);
    if (success) await renderTrashList();
}

async function permanentlyDeleteNote(noteId) {
    if (!confirm(t('main.confirmPermanentDelete'))) return;
    const success = await storageManager.permanentlyDeleteNote(noteId);
    if (success) await renderTrashList();
}

// ==================== 初始化 ====================
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

async function initApp() {
    console.log('Sparklet 初始化...');
    await storageManager.init();
    await initI18n();
    const theme = await window.electronStore.get('theme');
    setTheme(theme || 'light');
    bindEvents();
    await loadNotes();
    console.log('Sparklet 初始化完成');
}

function bindEvents() {
    // 主题切换
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
    // 回收站切换
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
    // 新建笔记
    const newNoteBtn = document.getElementById('newNoteBtn');
    if (newNoteBtn) newNoteBtn.addEventListener('click', createNewNote);
    // 颜色选择器
    const colorPalette = document.querySelectorAll('.color-option');
    colorPalette.forEach(btn => {
        btn.addEventListener('click', () => changeNoteColor(btn.dataset.color));
    });
    // 输入保存
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteArea');
    if (titleInput) titleInput.addEventListener('input', debounceSave);
    if (contentInput) contentInput.addEventListener('input', debounceSave);
    // 失焦保存
    window.addEventListener('blur', saveCurrentNote);

    // ========== 光晕位置同步（零偏移核心）==========
    window.electronAPI.on('settings-window-moved', ({ mainBounds, settingsBounds }) => {
        const glowMask = document.getElementById('settingsGlowMask');
        const relativeLeft = settingsBounds.x - mainBounds.x;
        const relativeTop = settingsBounds.y - mainBounds.y;
        glowMask.style.left = `${relativeLeft}px`;
        glowMask.style.top = `${relativeTop}px`;
        glowMask.style.width = `${settingsBounds.width}px`;
        glowMask.style.height = `${settingsBounds.height}px`;
    });

    // 新增：监听设置窗口重叠状态，自动控制虚化
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
document.addEventListener('DOMContentLoaded', initApp);
window.debugStorage = () => storageManager.debug();

// 窗口状态监听
window.electronAPI.on('settings-window-closed', () => {
    document.body.classList.remove('blur-background');
    document.getElementById('settingsGlowMask').classList.remove('show');
});
window.electronAPI.on('settings-window-minimized', () => {
    document.body.classList.remove('blur-background');
    document.getElementById('settingsGlowMask').classList.remove('show');
});
window.electronAPI.on('settings-window-restored', () => {
    document.body.classList.add('blur-background');
    document.getElementById('settingsGlowMask').classList.add('show');
});