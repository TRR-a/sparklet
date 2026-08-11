// popup.js - Sparklet 主弹窗逻辑
// 说明：处理笔记编辑、主题切换、回收站等核心功能

import storageManager from './storage-manager.js';
import { initI18n, t } from '../shared/i18n.js';

// ==================== 全局状态 ====================
let currentNoteId = null;
let currentView = 'main';

// ==================== Toast 提示（popup 专用） ====================
function showToastInPopup(message, duration = 3000, type = 'info') {
  const existing = document.querySelector('.toast-message');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  let bgColor = 'rgba(0, 0, 0, 0.85)';
  if (type === 'success') bgColor = 'rgba(40, 167, 69, 0.92)';
  else if (type === 'error') bgColor = 'rgba(220, 53, 69, 0.92)';
  else if (type === 'warning') bgColor = 'rgba(230, 162, 60, 0.92)';
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 28px',
    borderRadius: '8px',
    background: bgColor,
    color: '#fff',
    fontSize: '15px',
    fontWeight: '500',
    zIndex: '9999',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    opacity: '0',
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none',
    maxWidth: '80%',
    textAlign: 'center'
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

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
    if (isPreviewMode) {
        isPreviewMode = false;
        const ta = document.getElementById('noteArea');
        const pv = document.getElementById('notePreview');
        const btn = document.getElementById('previewToggleBtn');
        if (ta) ta.style.display = 'block';
        if (pv) pv.style.display = 'none';
        if (btn) { btn.classList.remove('active'); btn.textContent = '👁️ 预览'; }
    }
    currentNoteId = note.id;
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteArea');
    const previewToggleBtn = document.getElementById('previewToggleBtn');
    if (previewToggleBtn) previewToggleBtn.addEventListener('click', togglePreview);
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
                <div class="note-title">${note.title || t('main.noteUntitled')}<span class="note-format-tag">(MD)</span></div>
                <div class="note-filename">${note.id}.md</div>
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

let isPreviewMode = false;

async function togglePreview() {
    const textarea = document.getElementById('noteArea');
    const preview = document.getElementById('notePreview');
    const btn = document.getElementById('previewToggleBtn');
    if (!textarea || !preview || !btn) return;

    isPreviewMode = !isPreviewMode;

    if (isPreviewMode) {
        await saveCurrentNote();
        preview.innerHTML = renderMarkdown(textarea.value);
        textarea.style.display = 'none';
        preview.style.display = 'block';
        btn.classList.add('active');
        btn.textContent = '✏️ 编辑';
    } else {
        textarea.style.display = 'block';
        preview.style.display = 'none';
        btn.classList.remove('active');
        btn.textContent = '👁️ 预览';
    }
}

function renderMarkdown(text) {
    if (!text) return '<p style="opacity:0.5;">（空笔记）</p>';

    const escapeHtml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    let lastEnd = 0;
    const parts = [];
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        if (match.index > lastEnd) {
            const before = text.slice(lastEnd, match.index).trim();
            if (before) parts.push(`<p>${escapeHtml(before).replace(/\n/g, '<br>')}</p>`);
        }
        const lang = match[1] || '';
        const code = match[2] || '';
        const langLabel = lang ? `<span class="code-block-lang">${escapeHtml(lang)}</span>` : '';
        parts.push(`<div class="code-block">${langLabel}<pre style="margin:0;white-space:pre-wrap;word-wrap:break-word;">${escapeHtml(code)}</pre></div>`);
        lastEnd = match.index + match[0].length;
    }

    if (lastEnd < text.length) {
        const after = text.slice(lastEnd).trim();
        if (after) parts.push(`<p>${escapeHtml(after).replace(/\n/g, '<br>')}</p>`);
    }

    if (parts.length === 0) return `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`;
    return parts.join('');
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
        if (isPreviewMode) {
            isPreviewMode = false;
            const pv = document.getElementById('notePreview');
            const btn = document.getElementById('previewToggleBtn');
            if (pv) pv.style.display = 'none';
            if (btn) { btn.classList.remove('active'); btn.textContent = '👁️ 预览'; }
        }
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
                <div class="note-title">${note.title || t('main.noteUntitled')}<span class="note-format-tag">(MD)</span></div>
                <div class="note-filename">${note.id}.md</div>
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

// ==================== Toast 监听（从主进程接收） ====================
function bindToastListener() {
  window.electronAPI.onToastShow((data) => {
    // 支持两种 message 格式：
    // - 字符串：直接显示
    // - { key: 'i18n.key', params?: { foo: 'bar' } }：用渲染层 i18n 翻译（支持语言切换）
    let message = data.message;
    if (message && typeof message === 'object' && message.key) {
      message = t(message.key, message.params || {});
    }
    message = message || '提示';
    const duration = data.duration || 3000;
    const type = data.type || 'info';
    showToastInPopup(message, duration, type);
  });
  console.log('[Popup] Toast listener registered');
}

// ==================== 加载笔记 ====================
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
        // 获取第一个笔记的完整内容（包含 content）
        const firstNote = await storageManager.getNoteById(notes[0].id);
        if (firstNote) {
            currentNoteId = firstNote.id;
            await loadNoteIntoEditor(firstNote);
        } else {
            // 容错
            currentNoteId = notes[0].id;
            await loadNoteIntoEditor(notes[0]);
        }
    }
}

// ==================== 应用初始化 ====================
async function initApp() {
    console.log('Sparklet 初始化...');
    await storageManager.init();
    await initI18n();
    const theme = await window.electronStore.get('theme');
    setTheme(theme || 'light');
    bindEvents();
    await loadNotes();
    // ========== Toast 监听（新增） ==========
    bindToastListener();
    console.log('Sparklet 初始化完成');
}

// ==================== 绑定事件 ====================
function bindEvents() {
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

    const trashToggleBtn = document.getElementById('trashToggle');
    if (trashToggleBtn) trashToggleBtn.addEventListener('click', toggleTrashView);

    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', async () => {
            document.body.classList.add('blur-background');
            document.getElementById('settingsGlowMask').classList.add('show');
            await window.electronAPI.invoke('open-settings-window');
        });
    }

    const minimizeBtn = document.querySelector('.window-btn.minimize');
    const maximizeBtn = document.querySelector('.window-btn.maximize');
    const closeBtn = document.querySelector('.window-btn.close');
    if (minimizeBtn) minimizeBtn.addEventListener('click', () => window.electronAPI.invoke('window-minimize'));
    if (maximizeBtn) maximizeBtn.addEventListener('click', () => window.electronAPI.invoke('window-maximize'));
    if (closeBtn) closeBtn.addEventListener('click', () => window.electronAPI.invoke('window-close'));

    const newNoteBtn = document.getElementById('newNoteBtn');
    if (newNoteBtn) newNoteBtn.addEventListener('click', createNewNote);

    const colorPalette = document.querySelectorAll('.color-option');
    colorPalette.forEach(btn => {
        btn.addEventListener('click', () => changeNoteColor(btn.dataset.color));
    });

    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteArea');
    if (titleInput) titleInput.addEventListener('input', debounceSave);
    if (contentInput) contentInput.addEventListener('input', debounceSave);

    window.addEventListener('blur', saveCurrentNote);

    window.electronAPI.on('settings-window-moved', ({ mainBounds, settingsBounds }) => {
        const glowMask = document.getElementById('settingsGlowMask');
        const relativeLeft = settingsBounds.x - mainBounds.x;
        const relativeTop = settingsBounds.y - mainBounds.y;
        glowMask.style.left = `${relativeLeft}px`;
        glowMask.style.top = `${relativeTop}px`;
        glowMask.style.width = `${settingsBounds.width}px`;
        glowMask.style.height = `${settingsBounds.height}px`;
    });

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

// ==================== 窗口状态监听 ====================
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