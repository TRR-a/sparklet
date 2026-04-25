// storage-manager.js - Sparklet 存储管理器（Electron 安全版本）
// 说明：不再使用 chrome.storage.local，改为通过预加载脚本暴露的 window.electronStore API

class StorageManager {
    constructor() {
        // 缓存所有笔记数据，避免每次请求都访问持久化存储
        this.notesCache = null;
        // 标记是否已完成初始化
        this.initialized = false;
    }

    // 初始化存储系统并加载已有笔记
    async init() {
        if (this.initialized) return;

        // 从持久化存储读取笔记数据
        const result = await window.electronStore.get('sparkletNotes');

        if (!result || !Array.isArray(result)) {
            // 首次运行或数据格式异常时，创建空数组并保存
            await window.electronStore.set('sparkletNotes', []);
            this.notesCache = [];
        } else {
            // 使用已存在的笔记列表
            this.notesCache = result;
        }

        this.initialized = true;
        return this.notesCache;
    }

    // 返回所有未删除的笔记
    async getNotes() {
        if (!this.initialized) await this.init();
        return this.notesCache.filter(note => !note.isDeleted);
    }

    // 返回所有笔记，包括已删除项
    async getAllNotes() {
        if (!this.initialized) await this.init();
        return [...this.notesCache];
    }

    // 返回回收站内的已删除笔记
    async getTrashNotes() {
        if (!this.initialized) await this.init();
        return this.notesCache.filter(note => note.isDeleted);
    }

    // 根据 ID 获取单条笔记
    async getNoteById(id) {
        if (!this.initialized) await this.init();
        return this.notesCache.find(note => note.id === id);
    }

    // 创建一条新笔记并保存
    async createNote(title = '新笔记', color = '#4285f4') {
        if (!this.initialized) await this.init();

        const newNote = {
            id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            title,
            content: '',
            color,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false,
            deletedAt: null
        };

        this.notesCache.push(newNote);
        await this.saveToStorage();
        return newNote;
    }

    // 更新指定笔记内容并保存
    async updateNote(id, updates) {
        if (!this.initialized) await this.init();

        const index = this.notesCache.findIndex(note => note.id === id);
        if (index === -1) return null;

        this.notesCache[index] = {
            ...this.notesCache[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await this.saveToStorage();
        return this.notesCache[index];
    }

    // 软删除笔记，将其移动到回收站
    async deleteNote(id) {
        if (!this.initialized) await this.init();

        const index = this.notesCache.findIndex(note => note.id === id);
        if (index === -1) return false;

        this.notesCache[index] = {
            ...this.notesCache[index],
            isDeleted: true,
            deletedAt: new Date().toISOString()
        };

        await this.saveToStorage();
        return true;
    }

    // 从回收站还原笔记
    async restoreNote(id) {
        if (!this.initialized) await this.init();

        const index = this.notesCache.findIndex(note => note.id === id);
        if (index === -1) return false;

        this.notesCache[index] = {
            ...this.notesCache[index],
            isDeleted: false,
            deletedAt: null
        };

        await this.saveToStorage();
        return true;
    }

    // 永久删除笔记，从缓存和存储中彻底移除
    async permanentlyDeleteNote(id) {
        if (!this.initialized) await this.init();

        this.notesCache = this.notesCache.filter(note => note.id !== id);
        await this.saveToStorage();
        return true;
    }

    // 保存缓存到持久化存储
    async saveToStorage() {
        await window.electronStore.set('sparkletNotes', this.notesCache);
    }

    // 调试方法：输出当前存储状态
    async debug() {
        const notes = await this.getAllNotes();
        console.log('=== 存储调试 ===');
        console.log('笔记总数:', notes.length);
        console.log('活跃笔记:', notes.filter(n => !n.isDeleted).length);
        console.log('回收站笔记:', notes.filter(n => n.isDeleted).length);
        return notes;
    }
}

// 创建并导出单例实例，确保全局共享同一份存储管理器
const storageManager = new StorageManager();
export default storageManager;