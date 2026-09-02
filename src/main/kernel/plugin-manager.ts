// Plugin manager: discover plugins from disk and resolve their manifests [插件管理器：从磁盘发现插件并解析清单]
// Microkernel: the kernel scans well-known roots, any folder containing a
// plugin.json is a plugin. Built-in plugins ship inside the app bundle
// (app.getAppPath()/modules); user-installed plugins live under
// userData/plugins (downloaded later from the plugin market).
// [微内核：内核扫描已知根目录，任何含 plugin.json 的文件夹即视为插件。
// 内置插件随应用分发 (app.getAppPath()/modules)；用户安装的插件位于
// userData/plugins (未来从插件市场下载)]

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import type { PluginDescriptor, PluginManifest } from '../../shared/types/plugins';

// Well-known plugin search roots [已知插件搜索根目录]
//
// Built-in plugins MUST be read from the compiled build tree (this file runs
// from build/src/main/kernel, so ../../../modules == build/modules). Pointing
// at the source-tree modules/ would load .html whose sibling .js entries are
// emitted only into build/ (source tree keeps .ts only), so the plugin page
// would fail to bootstrap. User-installed plugins live under userData/plugins.
// [内置插件必须从编译后的 build 树读取 (本文件运行于 build/src/main/kernel，
// 故 ../../../modules == build/modules)。若指向源码树 modules/，加载的 .html
// 其同级 .js 入口仅输出到 build/ (源码树只有 .ts)，插件页面将无法启动。
// 用户安装的插件位于 userData/plugins]
function pluginRoots(): string[] {
  return [
    path.join(__dirname, '../../../modules'),
    path.join(app.getPath('userData'), 'plugins'),
  ];
}

// Validate manifest id (lowercase alphanumeric + dashes) [校验清单 id]
const ID_RE = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Parse a plugin.json into a descriptor, or null when invalid [将 plugin.json 解析为描述，非法时返回 null]
 */
function resolvePlugin(dir: string): PluginDescriptor | null {
  const manifestPath = path.join(dir, 'plugin.json');
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
  const manifest = raw as Partial<PluginManifest>;
  if (
    typeof manifest.id !== 'string' ||
    !ID_RE.test(manifest.id) ||
    typeof manifest.name !== 'string' ||
    typeof manifest.version !== 'string' ||
    typeof manifest.main !== 'string'
  ) {
    return null;
  }
  // The main entry must actually exist [主入口必须真实存在]
  if (!fs.existsSync(path.join(dir, manifest.main))) return null;

  const iconPath = manifest.icon
    ? path.join(dir, manifest.icon)
    : '';
  return {
    id: manifest.id,
    name: manifest.name,
    nameI18n: manifest.nameI18n && typeof manifest.nameI18n === 'object'
      ? manifest.nameI18n as Record<string, string>
      : null,
    description: typeof manifest.description === 'string' ? manifest.description : '',
    version: manifest.version,
    author: typeof manifest.author === 'string' ? manifest.author : '',
    iconPath: iconPath && fs.existsSync(iconPath) ? iconPath : '',
    main: manifest.main,
  };
}

/**
 * Scan all plugin roots and return discovered plugins (sorted by id) [扫描所有插件根目录并返回发现的插件 (按 id 排序)]
 */
export function getPlugins(): PluginDescriptor[] {
  const found = new Map<string, PluginDescriptor>();
  for (const root of pluginRoots()) {
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const pluginDir = path.join(root, entry.name);
      const descriptor = resolvePlugin(pluginDir);
      if (descriptor) {
        // Roots are searched in priority order; first valid wins [根目录按优先级搜索，首个有效者胜出]
        if (!found.has(descriptor.id)) {
          found.set(descriptor.id, descriptor);
        }
      }
    }
  }
  return Array.from(found.values()).sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Find a single plugin by id (undefined when not installed) [按 id 查找插件 (未安装时返回 undefined)]
 */
export function findPlugin(id: string): PluginDescriptor | undefined {
  return getPlugins().find((plugin) => plugin.id === id);
}

/**
 * Absolute path to a plugin's root directory (used to resolve its HTML) [插件根目录的绝对路径 (用于解析其 HTML)]
 */
export function getPluginRoot(id: string): string | null {
  for (const root of pluginRoots()) {
    const dir = path.join(root, id);
    if (fs.existsSync(path.join(dir, 'plugin.json'))) return dir;
  }
  return null;
}
