// Plugin descriptor types (microkernel) [插件描述类型 (微内核)]
// Shared between main (discovery) and kernel renderer (hub UI) [主进程 (发现) 与内核渲染层 (Hub UI) 共用]

/**
 * Plugin manifest on disk (modules/<id>/plugin.json) [磁盘上的插件清单 (modules/<id>/plugin.json)]
 */
export interface PluginManifest {
  /** Unique plugin id (lowercase, digits, dashes) [插件唯一 ID (小写、数字、连字符)] */
  id: string;
  /** Display name (fallback when nameI18n lacks the current language) [显示名称 (当前语言缺失 nameI18n 时的回退)] */
  name: string;
  /** Localized display names, keyed by BCP-47 language tag [本地化显示名称，键为 BCP-47 语言标签] */
  nameI18n?: Record<string, string>;
  /** One-line description [一句话描述] */
  description?: string;
  /** Plugin version [插件版本] */
  version: string;
  /** Author / maintainer [作者/维护者] */
  author?: string;
  /** Main page entry, relative to the plugin root (e.g. "popup/popup.html") [主页面入口，相对插件根目录] */
  main: string;
  /** Icon path, relative to the plugin root (optional) [图标路径，相对插件根目录 (可选)] */
  icon?: string;
}

/**
 * Plugin descriptor exposed to the kernel UI (discovery result) [暴露给内核 UI 的插件描述 (发现结果)]
 */
export interface PluginDescriptor {
  id: string;
  name: string;
  nameI18n: Record<string, string> | null;
  description: string;
  version: string;
  author: string;
  /** Absolute icon path usable as file:// src ('' if none) [可作为 file:// src 的图标绝对路径 (无则为 '')] */
  iconPath: string;
  /** Main page entry, relative to the plugin root [主页面入口，相对插件根目录] */
  main: string;
}
