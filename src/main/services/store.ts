// electron-store instance for persistent config storage [electron-store 实例，用于本地持久化存储配置]
// Used for language, theme, migration flags, and other app-level config [用于语言、主题、迁移标记等应用级配置]

// eslint-disable-next-line @typescript-eslint/no-var-requires
import Store from 'electron-store';

// Initialize storage (for config and migration flags) [初始化存储 (用于配置和迁移标记)]
export const store = new Store({
  name: 'sparklet-data',
  defaults: {
    sparkletNotes: [] as unknown[]
  }
});
