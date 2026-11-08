// Updater constants: default config & interval options [更新常量 - 默认配置与频率选项]

// Default config [默认配置]
export const DEFAULT_CONFIG = {
  updateBehavior: 'auto' as 'auto' | 'notify-only' | 'disabled',  // 'auto' | 'notify-only' | 'disabled'
  checkInterval: 86400000,     // ms, default 24 hours [毫秒，默认 24 小时]
  lastCheckTime: null as string | null,
  autoDownload: true,
  integrityCheck: true,        // Verify app integrity on startup (default true) [启动时校验应用完整性 (默认 true)]
  cacheRetentionDays: 7        // Retain X days after successful launch (7~30, user configurable; fallback 30 days if never launched) [成功打开后保留 X 天 (7~30，用户可配；未成功打开的兜底 30 天不变)]
};

// Interval options (display text -> milliseconds) [频率选项 (显示文本 → 毫秒)]
export const INTERVAL_OPTIONS: Array<{ label: string; value: number }> = [
  { label: '重启后', value: 0 },
  { label: '30 分钟', value: 1800000 },
  { label: '1 小时', value: 3600000 },
  { label: '1 天', value: 86400000 },
  { label: '1 周', value: 604800000 }
];
