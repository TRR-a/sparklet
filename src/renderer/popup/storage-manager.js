// storage-manager.js - Sparklet 存储管理器 (Electron 安全版本)
// 重要变化：不再使用 chrome.storage.local，改为通过预加载脚本暴露的 window.electronStore API

class StorageManager {
    constructor() {
        // 缓存所有笔记数据，避免频繁读取存储
        this.notesCache = null;
        // 标记存储是否已完成初始化
        this.initialized = false;
    }

    // 初始化存储系统
    async init() {
        // 如果已经初始化，直接返回
        if (this.initialized) return;
        
        // 关键改动1：使用 window.electronStore.get 替代 chrome.storage.local.get
        // 从存储中获取 sparkletNotes 数据
        const result = await window.electronStore.get('sparkletNotes');
        
        // 检查数据是否存在且是数组格式
        if (!result || !Array.isArray(result)) {
            // 首次运行或数据损坏：创建空数组并保存
            await window.electronStore.set('sparkletNotes', []);
            this.notesCache = [];
        } else {
            // 使用已存在的数据
            this.notesCache = result;
        }
        
        // 标记初始化完成
        this.initialized = true;
        return this.notesCache;
    }

    // 获取所有未删除的活跃笔记
    async getNotes() {
        if (!this.initialized) await this.init();
        return this.notesCache.filter(note => !note.isDeleted);
    }

    // 获取所有笔记（包括已删除的）
    async getAllNotes() {
        if (!this.initialized) await this.init();
        return [...this.notesCache];
    }

    // 获取回收站中的笔记（已删除的）
    async getTrashNotes() {
        if (!this.initialized) await this.init();
        return this.notesCache.filter(note => note.isDeleted);
    }

    // 根据笔记ID查找特定笔记
    async getNoteById(id) {
        if (!this.initialized) await this.init();
        return this.notesCache.find(note => note.id === id);
    }

    // 创建新笔记
    async createNote(title = '新笔记', color = '#4285f4') {
        if (!this.initialized) await this.init();
        
        // 构建新笔记对象
        const newNote = {
            id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5), // 生成唯一ID
            title: title,
            content: '',
            color: color,
            createdAt: new Date().toISOString(), // 创建时间
            updatedAt: new Date().toISOString(), // 更新时间
            isDeleted: false, // 删除标记
            deletedAt: null   // 删除时间
        };
        
        // 添加到缓存并保存
        this.notesCache.push(newNote);
        await this.saveToStorage();
        
        return newNote;
    }

    // 更新现有笔记
    async updateNote(id, updates) {
        if (!this.initialized) await this.init();
        
        // 查找笔记索引
        const index = this.notesCache.findIndex(note => note.id === id);
        if (index === -1) return null; // 未找到笔记
        
        // 合并更新内容，并更新修改时间
        this.notesCache[index] = {
            ...this.notesCache[index], // 保留原有属性
            ...updates,                // 应用新属性
            updatedAt: new Date().toISOString() // 更新修改时间
        };
        
        // 保存更改
        await this.saveToStorage();
        return this.notesCache[index];
    }

    // 软删除笔记（移动到回收站）
    async deleteNote(id) {
        if (!this.initialized) await this.init();
        
        const index = this.notesCache.findIndex(note => note.id === id);
        if (index === -1) return false;
        
        // 标记为已删除，记录删除时间
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
        
        // 清除删除标记
        this.notesCache[index] = {
            ...this.notesCache[index],
            isDeleted: false,
            deletedAt: null
        };
        
        await this.saveToStorage();
        return true;
    }

    // 永久删除笔记（从缓存和存储中完全移除）
    async permanentlyDeleteNote(id) {
        if (!this.initialized) await this.init();
        
        // 过滤掉指定ID的笔记
        this.notesCache = this.notesCache.filter(note => note.id !== id);
        await this.saveToStorage();
        return true;
    }

    // 内部方法：将缓存保存到持久化存储
    async saveToStorage() {
        // 关键改动2：使用 window.electronStore.set 替代 chrome.storage.local.set
        await window.electronStore.set('sparkletNotes', this.notesCache);
    }

    // 调试方法：在控制台输出存储状态
    async debug() {
        const notes = await this.getAllNotes();
        console.log('=== 存储调试 ===');
        console.log('笔记总数:', notes.length);
        console.log('活跃笔记:', notes.filter(n => !n.isDeleted).length);
        console.log('回收站笔记:', notes.filter(n => n.isDeleted).length);
        return notes;
    }
}

// 创建并导出单例实例
// 注意：整个应用中只会有一个 StorageManager 实例
const storageManager = new StorageManager();
export default storageManager;