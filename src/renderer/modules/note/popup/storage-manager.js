// storage-manager.js - Sparklet 文件系统存储管理器
// 说明：每个笔记独立存储为 .json(元数据) + .md(正文)

class StorageManager {
    constructor() {
        this.notesCache = null;
        this.initialized = false;
    }

    // 初始化：从文件系统加载所有笔记
    async init() {
        if (this.initialized) return;
        await this.loadFromFS();
        this.initialized = true;
        return this.notesCache;
    }

    // 从文件系统加载并缓存
    async loadFromFS() {
        try {
            const result = await window.notesAPI.list();
            if (result.success) {
                this.notesCache = result.notes || [];
            } else {
                console.error('加载笔记列表失败:', result.error);
                this.notesCache = [];
            }
        } catch (err) {
            console.error('加载笔记异常:', err);
            this.notesCache = [];
        }
        return this.notesCache;
    }

    // 返回未删除的笔记
    async getNotes() {
        if (!this.initialized) await this.init();
        return this.notesCache.filter(note => !note.isDeleted);
    }

    // 返回所有笔记（含已删除）
    async getAllNotes() {
        if (!this.initialized) await this.init();
        return [...this.notesCache];
    }

    // 返回回收站笔记
    async getTrashNotes() {
        if (!this.initialized) await this.init();
        return this.notesCache.filter(note => note.isDeleted);
    }

    // 按 ID 获取单篇笔记（含正文）
    async getNoteById(id) {
        if (!this.initialized) await this.init();
        try {
            const result = await window.notesAPI.get(id);
            if (result.success) {
                return result.note;
            }
            return null;
        } catch (err) {
            console.error('获取笔记失败:', err);
            return null;
        }
    }

    // 创建新笔记（物理文件落盘）
    async createNote(title = '无标题', color = '#4285f4') {
        if (!this.initialized) await this.init();

        const newNote = {
            id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title: title || '无标题',
            content: '',
            color: color || '#4285f4',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false,
            deletedAt: null
        };

        // 调用 IPC 保存到文件系统
        const result = await window.notesAPI.save(newNote);
        if (result.success) {
            this.notesCache.push(newNote);
            return newNote;
        } else {
            console.error('创建笔记失败:', result.error);
            throw new Error(result.error);
        }
    }

    // 更新笔记
    async updateNote(id, updates) {
        if (!this.initialized) await this.init();

        const index = this.notesCache.findIndex(n => n.id === id);
        if (index === -1) return null;

        // 获取当前完整数据（含 content）
        const current = await this.getNoteById(id);
        if (!current) return null;

        // 合并更新
        const updated = {
            ...current,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // 保存到文件系统
        const result = await window.notesAPI.save(updated);
        if (result.success) {
            // 更新缓存（仅元数据部分）
            const metaOnly = { ...updated };
            delete metaOnly.content;
            this.notesCache[index] = metaOnly;
            return updated;
        } else {
            console.error('更新笔记失败:', result.error);
            return null;
        }
    }

    // 软删除（移回收站）
    async deleteNote(id) {
        if (!this.initialized) await this.init();
        const result = await window.notesAPI.delete(id);
        if (result.success) {
            // 刷新缓存
            await this.loadFromFS();
            return true;
        }
        return false;
    }

    // 从回收站恢复
    async restoreNote(id) {
        if (!this.initialized) await this.init();
        const result = await window.notesAPI.restore(id);
        if (result.success) {
            await this.loadFromFS();
            return true;
        }
        return false;
    }

    // 永久删除（物理删除文件）
    async permanentlyDeleteNote(id) {
        if (!this.initialized) await this.init();
        const result = await window.notesAPI.permanentDelete(id);
        if (result.success) {
            await this.loadFromFS();
            return true;
        }
        return false;
    }

    // 刷新缓存（对外暴露，设置页/手动刷新用）
    async refresh() {
        await this.loadFromFS();
        return this.notesCache;
    }

    // 调试
    async debug() {
        await this.loadFromFS();
        console.log('=== 存储调试 (文件系统) ===');
        console.log('笔记总数:', this.notesCache.length);
        console.log('活跃笔记:', this.notesCache.filter(n => !n.isDeleted).length);
        console.log('回收站笔记:', this.notesCache.filter(n => n.isDeleted).length);
        return this.notesCache;
    }
}

const storageManager = new StorageManager();
export default storageManager;