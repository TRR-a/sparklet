// storage-manager.js - Sparklet 存储管理器
// 集中管理所有存储操作，解决数据同步问题

class StorageManager {
    constructor() {
        this.notesCache = null;
        this.initialized = false;
    }

    // 初始化存储
    async init() {
        if (this.initialized) return;
        
        const result = await chrome.storage.local.get(['sparkletNotes']);
        if (!result.sparkletNotes || !Array.isArray(result.sparkletNotes)) {
            // 第一次使用，创建空数组
            await chrome.storage.local.set({ sparkletNotes: [] });
            this.notesCache = [];
        } else {
            this.notesCache = result.sparkletNotes;
        }
        
        this.initialized = true;
        return this.notesCache;
    }

    // 获取所有活跃笔记（未删除的）
    async getNotes() {
        if (!this.initialized) await this.init();
        return this.notesCache.filter(note => !note.isDeleted);
    }

    // 获取所有笔记（包括已删除的）
    async getAllNotes() {
        if (!this.initialized) await this.init();
        return [...this.notesCache];
    }

    // 获取回收站笔记
    async getTrashNotes() {
        if (!this.initialized) await this.init();
        return this.notesCache.filter(note => note.isDeleted);
    }

    // 根据ID获取笔记
    async getNoteById(id) {
        if (!this.initialized) await this.init();
        return this.notesCache.find(note => note.id === id);
    }

    // 创建新笔记
    async createNote(title = '新笔记', color = '#4285f4') {
        if (!this.initialized) await this.init();
        
        const newNote = {
            id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            title: title,
            content: '',
            color: color,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false,
            deletedAt: null
        };
        
        this.notesCache.push(newNote);
        await this.saveToStorage();
        
        return newNote;
    }

    // 更新笔记
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

    // 软删除笔记（移动到回收站）
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

    // 永久删除笔记
    async permanentlyDeleteNote(id) {
        if (!this.initialized) await this.init();
        
        this.notesCache = this.notesCache.filter(note => note.id !== id);
        await this.saveToStorage();
        return true;
    }

    // 内部方法：保存到存储
    async saveToStorage() {
        await chrome.storage.local.set({ sparkletNotes: this.notesCache });
    }

    // 调试方法
    async debug() {
        const notes = await this.getAllNotes();
        console.log('=== 存储调试 ===');
        console.log('笔记总数:', notes.length);
        console.log('活跃笔记:', notes.filter(n => !n.isDeleted).length);
        console.log('回收站笔记:', notes.filter(n => n.isDeleted).length);
        return notes;
    }
}

// 创建单例实例
const storageManager = new StorageManager();
export default storageManager;