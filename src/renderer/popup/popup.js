// popup.js - Sparklet 主逻辑（修复版）
import storageManager from './storage-manager.js';

// ==================== 全局状态 ====================
let currentNoteId = null;
let currentView = 'main'; // 'main' 或 'trash'

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

// 主题设置函数
function setTheme(theme) {
    document.body.dataset.theme = theme;
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.setAttribute('aria-label',
            theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题');
    }
}

// 主题切换函数
async function toggleTheme() {
    const currentTheme = document.body.dataset.theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    await window.electronStore.set('theme', newTheme);
}

// 更新激活的颜色选择器
function updateActiveColor(color) {
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === color);
    });
}

// ==================== 笔记管理函数 ====================

// 加载笔记到编辑器
async function loadNoteIntoEditor(note) {
    if (!note) return;
    
    currentNoteId = note.id;
    
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteArea');
    
    if (titleInput) titleInput.value = note.title || '';
    if (contentInput) contentInput.value = note.content || '';
    
    // 更新颜色选择器
    updateActiveColor(note.color);
    
    // 更新列表项高亮
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
        
        if (note.id === currentNoteId) {
            li.classList.add('active');
        }
        
        li.innerHTML = `
            <span class="note-color-dot" style="background-color: ${note.color};"></span>
            <div class="note-text">
                <div class="note-title">${note.title || '无标题'}</div>
                <div class="note-time">${formatDate(note.updatedAt)}</div>
            </div>
            <button class="note-delete-btn" title="删除笔记">🗑️</button>
        `;
        
        // 点击切换笔记（排除删除按钮）
        li.addEventListener('click', (e) => {
            if (!e.target.classList.contains('note-delete-btn')) {
                switchNote(note.id);
            }
        });
        
        // 删除按钮点击事件
        const deleteBtn = li.querySelector('.note-delete-btn');
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await handleDeleteNote(note.id, li);
        });
        
        noteList.appendChild(li);
    });
}

// 切换到另一条笔记
async function switchNote(noteId) {
    // 先保存当前笔记
    await saveCurrentNote();
    
    // 加载新笔记
    const note = await storageManager.getNoteById(noteId);
    if (note) {
        await loadNoteIntoEditor(note);
    }
}

// 保存当前笔记
let saveTimeout;
async function saveCurrentNote() {
    if (!currentNoteId) return;
    
    clearTimeout(saveTimeout);
    
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteArea');
    
    if (!titleInput || !contentInput) return;
    
    const title = titleInput.value.trim();
    const content = contentInput.value;
    
    // 如果标题为空，用内容前20字生成标题
    const finalTitle = title || content.substring(0, 20) || '新笔记';
    
    await storageManager.updateNote(currentNoteId, {
        title: finalTitle,
        content: content
    });
    
    // 更新列表显示
    const notes = await storageManager.getNotes();
    await renderNoteList(notes);
}

// 防抖保存
function debounceSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveCurrentNote, 800);
}

// 创建新笔记
async function createNewNote() {
    const newNote = await storageManager.createNote('新笔记');
    const notes = await storageManager.getNotes();
    
    await renderNoteList(notes);
    await loadNoteIntoEditor(newNote);
    
    // 焦点到标题输入框
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

// 删除笔记（双击防误删）
async function handleDeleteNote(noteId, listItemElement) {
    if (listItemElement.classList.contains('deleting')) {
        // 第二次点击：执行删除
        console.log('删除笔记:', noteId);
        
        // 执行软删除
        const success = await storageManager.deleteNote(noteId);
        if (!success) {
            console.error('删除失败');
            return;
        }
        
        // 获取删除后的活跃笔记
        const activeNotes = await storageManager.getNotes();
        
        // 重新渲染整个列表
        await renderNoteList(activeNotes);
        
        if (noteId === currentNoteId) {
            // 如果删除的是当前编辑的笔记
            if (activeNotes.length > 0) {
                // 切换到第一个笔记
                const firstNote = activeNotes[0];
                currentNoteId = firstNote.id;
                await loadNoteIntoEditor(firstNote);
            } else {
                // 没有其他笔记，创建新的
                const newNote = await storageManager.createNote('新笔记');
                currentNoteId = newNote.id;
                await loadNoteIntoEditor(newNote);
            }
        }
    } else {
        // 第一次点击：标记为待删除状态
        listItemElement.classList.add('deleting');
        
        // 3秒后自动取消删除状态
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
        // 切换到回收站视图
        currentView = 'trash';
        document.body.classList.add('trash-view');
        trashToggleBtn.style.opacity = '1';
        trashToggleBtn.style.color = '#ea4335';
        if (newNoteBtn) newNoteBtn.style.display = 'none';
        if (noteTitleInput) noteTitleInput.style.display = 'none';
        if (noteEditor) noteEditor.style.display = 'none';
        
        await renderTrashList();
    } else {
        // 切换回主视图
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

// 渲染回收站列表
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
                <div class="note-title">${note.title || '无标题'}</div>
                <div class="note-time">删除于: ${new Date(note.deletedAt).toLocaleString()}</div>
            </div>
            <div class="trash-actions">
                <button class="restore-btn" data-note-id="${note.id}">还原</button>
                <button class="permanent-delete-btn" data-note-id="${note.id}">彻底删除</button>
            </div>
        `;
        noteList.appendChild(li);
    });
    
    // 绑定回收站按钮事件
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

// 从回收站还原
async function restoreFromTrash(noteId) {
    const success = await storageManager.restoreNote(noteId);
    if (success) {
        await renderTrashList();
        console.log('笔记已还原');
    }
}

// 永久删除
async function permanentlyDeleteNote(noteId) {
    if (!confirm('确定要永久删除此笔记吗？此操作不可撤销！')) {
        return;
    }
    
    const success = await storageManager.permanentlyDeleteNote(noteId);
    if (success) {
        await renderTrashList();
        console.log('笔记已永久删除');
    }
}

// ==================== 初始化 ====================

// 加载笔记列表
async function loadNotes() {
    await storageManager.init();
    
    const notes = await storageManager.getNotes();
    
    if (notes.length === 0) {
        // 如果没有笔记，创建一个
        const newNote = await storageManager.createNote('我的第一个笔记');
        currentNoteId = newNote.id;
        await renderNoteList([newNote]);
        await loadNoteIntoEditor(newNote);
    } else {
        await renderNoteList(notes);
        // 默认显示第一个笔记
        currentNoteId = notes[0].id;
        await loadNoteIntoEditor(notes[0]);
    }
}

// 初始化应用
async function initApp() {
    console.log('Sparklet 初始化...');
    
    // 初始化存储管理器
    await storageManager.init();
    
    // 使用通过预加载脚本暴露的、安全的Electron存储API
    const theme = await window.electronStore.get('theme');
    setTheme(theme || 'light');
    
    // 绑定事件
    bindEvents();
    
    // 加载笔记
    await loadNotes();
    
    console.log('Sparklet 初始化完成');
}

// 绑定所有事件
function bindEvents() {
    // 主题切换按钮
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // 回收站切换按钮
    const trashToggleBtn = document.getElementById('trashToggle');
    if (trashToggleBtn) {
        trashToggleBtn.addEventListener('click', toggleTrashView);
    }

    // 设置按钮
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', async () => {
            // 添加虚化类
            document.body.classList.add('blur-background');
            await window.electronAPI.invoke('open-settings-window');
            // 如果设置窗口被隐藏，`open-settings-window` 内部会显示它
        });
    }

   // ===== 窗口控制按钮事件 =====
    const minimizeBtn = document.querySelector('.window-btn.minimize');
    const maximizeBtn = document.querySelector('.window-btn.maximize');
    const closeBtn = document.querySelector('.window-btn.close');

    if (minimizeBtn) {
        // 修正：主窗口最小化应该正常最小化到任务栏
        minimizeBtn.addEventListener('click', () => {
            window.electronAPI.invoke('window-minimize');
        });
    }
    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', () => {
            window.electronAPI.invoke('window-maximize');
        });
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.electronAPI.invoke('window-close');
        });
    }
    
    // 新建笔记按钮
    const newNoteBtn = document.getElementById('newNoteBtn');
    if (newNoteBtn) {
        newNoteBtn.addEventListener('click', createNewNote);
    }
    
    // 颜色选择器
    const colorPalette = document.querySelectorAll('.color-option');
    colorPalette.forEach(btn => {
        btn.addEventListener('click', () => {
            const color = btn.dataset.color;
            changeNoteColor(color);
        });
    });
    
    // 标题和内容输入保存
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteArea');
    
    if (titleInput) {
        titleInput.addEventListener('input', debounceSave);
    }
    
    if (contentInput) {
        contentInput.addEventListener('input', debounceSave);
    }
    
    // 窗口失焦时保存
    window.addEventListener('blur', async () => {
        await saveCurrentNote();
    });
}

// ==================== DOM 加载完成 ====================

document.addEventListener('DOMContentLoaded', initApp);

// 导出调试函数（可选）
window.debugStorage = () => storageManager.debug();

// 监听设置窗口关闭事件：移除虚化
window.electronAPI.on('settings-window-closed', () => {
    document.body.classList.remove('blur-background');
});

// 监听设置窗口最小化事件：移除虚化
window.electronAPI.on('settings-window-minimized', () => {
    document.body.classList.remove('blur-background');
});

// 监听设置窗口恢复事件：重新添加虚化
window.electronAPI.on('settings-window-restored', () => {
    document.body.classList.add('blur-background');
});