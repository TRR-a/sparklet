// Updater constants: cache retention policy [更新常量 - 缓存保留策略]

// ========== Update package cache: retention policy ========== [更新包缓存：保留策略]
// Retention days after successful launch is user-configurable (7~30, default 7); here we only store default and range [成功打开后的保留天数由用户配置 (7~30，默认 7)，这里只存默认值和范围]
export const DEFAULT_CACHE_SUCCESS_RETENTION_DAYS = 7;
export const CACHE_RETENTION_MIN_DAYS = 7;
export const CACHE_RETENTION_MAX_DAYS = 30;
// Fallback retention for unused versions (downloaded but never installed/launched/crashed on launch): 30 days (not configurable, to avoid accidental deletion) [没成功用过的版本 (下了没装/装了没成功打开/秒崩)，兜底保留 30 天 (不可配置，避免误删)]
export const CACHE_UNUSED_RETENTION_DAYS = 30;
export const CACHE_MAX_VERSIONS = 2;             // Keep at most 2 versions simultaneously [最多同时保留 2 个版本]
export const CACHE_SUCCESS_MARK_DELAY_MS = 30 * 1000; // Delay 30s after startup before writing successFirstLaunchAt (anti-instant-crash) [启动后延迟 30 秒才写 successFirstLaunchAt (防秒崩)]
