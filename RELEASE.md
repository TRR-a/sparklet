## English
# Sparklet v0.2.2 Release Notes
*Internal Codename: Vapor · 水蒸气*

Release Date: August 8, 2026

---

## 📦 Quick Start After Downloading

Download this file from the GitHub Releases page: **`sparklet-v0.2.2-win-x86_64.zip`** (ZIP Portable / Green version).

| | Instructions |
|---|---|
| **1. Extract** | **DO NOT double-click Sparklet.exe from inside the ZIP preview window!** Right-click the ZIP → **"Extract All…"** → choose a folder **WITHOUT Chinese characters or spaces** (e.g. `D:\Apps\Sparklet\`). |
| **2. Launch** | After extraction, open the unzipped folder. You will see `Sparklet.exe` together with `*.dll` files and a `resources/` folder. **Double-click Sparklet.exe** to launch. |
| **3. SmartScreen** | If Windows Defender SmartScreen warns the app is "unrecognized", click **"More info" → "Run anyway"**. The warning appears because the package is not digitally signed; the app itself is clean and safe. |
| **4. Shortcut (optional)** | Right-click `Sparklet.exe` → **"Send to" → "Desktop (create shortcut)"** so you can launch it from the desktop later. |

---

## ✨ What's New
1.  **Auto Update System** - Full integration with GitHub Releases. Includes version check, **full ZIP package download** with progress callbacks, SHA256 integrity verification, and an asar-safe external updater:
    -   **External Updater (asar-safe)** - Spawns a detached Node process (`ELECTRON_RUN_AS_NODE=1`) to replace all files after the main process exits. Uses Windows-safe rename-then-write strategy for locked files (exe/dll/asar). Automatically restarts the app after replacement.
    -   *Note: The previous "Direct Replace" strategy was removed because asar archives are read-only and cannot be patched in-place inside a running app.*
2.  **Update Package Cache System** - Downloaded update ZIPs are persisted in `userData/update_cache/` with metadata tracking:
    -   **Rollback Support** - When startup integrity check fails, the system can reinstall from a cached ZIP (verified via SHA256) without re-downloading
    -   **Retention Policy** - Successfully launched versions kept for user-configurable 7~30 days; unused versions kept for 30 days; max 2 versions cached simultaneously
    -   **Smart Cleanup** - Prioritizes deleting unused versions over successfully launched ones; excludes the just-registered version from cleanup
    -   **Settings Panel Integration** - View cache info, configure retention days, refresh or clear cache
3.  **Startup Integrity Check** - SHA256-based multi-layer verification: executable hash (`exeHash`) + installed files combined hash (`filesHash`). Cloud `manifest.releases.json` fallback when local manifest is missing. Failure triggers a rollback dialog with options to reinstall from cache or open the release page.
4.  **Independent Configuration System** - Three candidate config directory names (`SparkletConfig`, `sparklet-config`, `.sparkletconf`) scanned in order. Real-time file change monitoring via `fs.watch` (handles both `change` and `rename` events on Windows) with debounced config-change broadcast to all windows. Self-write detection prevents redundant notifications.
5.  **Settings Panel Update Section** - Added configuration controls, status panels and action buttons:
    -   Update Behavior dropdown: Auto / Notify Only / Disabled
    -   Check Frequency dropdown: On Startup / 30 min / 1 hour / 1 day / 1 week
    -   File Integrity Check checkbox
    -   Update Cache section: retention slider (7~30 days), cache info display, refresh & clear buttons
    -   Config Import/Export: backup and restore updater settings as JSON
    -   "Check Now" manual trigger button
    -   **Open Official Site Button** (🌐) - Opens the GitHub project homepage in the default browser
    -   **Official URL Copy** - One-click copy of the project GitHub URL with accelerator hint
6.  **Toast Notification System** - Toast feedback now supported on both the main window (popup) and the settings panel. Supports localized i18n messages with parameter interpolation.
7.  **Dev Environment Detection** - When launched via source code (`!app.isPackaged`), the update system is automatically disabled, the settings update section UI is locked to prevent mis-clicks, and a 10-second Toast reminder is displayed.
8.  **Project Structure Refactor** - Moved the entire note module down to `src/renderer/modules/note/`, reserving a namespace for the planned v0.2.6+ multi-tab architecture.

## 🎨 Experience & Visual Improvements
1.  Updated application icon to **icon256.ico** with 6 embedded sizes: 256×256 / 128×128 / 64×64 / 48×48 / 32×32 / 16×16 for sharp rendering across all DPI scalings.
2.  Added a settings sub-section style for the Update configuration area, matching the glassmorphism visual language.
3.  Changed all console log output to English to avoid encoding corruption and garbled text on non-UTF-8 console windows.
4.  Standardized the restart dialog timeout behavior — a 30-second countdown that cleans its own timer on user action.
5.  Cleaned up dead code paths left over from the legacy custom HTML-based update dialog and switched to native dialogs.

## 🔧 Technical & Configuration Updates
1.  **Version Information**: Semantic version updated to `0.2.2`, internal codename renamed from `Water` to `Vapor`.
2.  **Package Naming**: Release ZIP renamed to the platform-aware convention **`sparklet-vX.X.X-win-x86_64.zip`**.
3.  **Build Configuration**: `electron-builder` configured with `win.target: zip` (portable ZIP only; NSIS installer may be added in v0.2.3). Output directory follows the versioned path **`release/v0.2.2/`**.
4.  **Storage Splitting**: Note data, global configuration, and system configuration are now stored as three separate Electron Store instances.
5.  **Manifest Generation**: Three-phase `generate-manifest.js` script generates `exeHash`, `filesHash`, and `packageHash` separately. Reads `package.json` dynamically via `fs.readJson` (no Node module cache pollution).
6.  **Shared Integrity Rules**: `_integrity-rules.js` provides a single source of truth for file filtering (blacklist), used by both the build-time manifest generator and the runtime verifier.
7.  **Commit Quality Tooling** (effective from v0.2.3): Integrated `@commitlint/cli` + `@commitlint/config-conventional` + `husky` via Git `commit-msg` hook.
8.  **Dependencies**: Added `fs-extra` and `unzipper` production dependencies. Added commitlint and husky dev dependencies.

## 🐛 Bug Fixes

### Development Phase Fixes
The following fixes were completed during the v0.2.2 development cycle:

1.  **[Critical] ZIP Filename Regex Mismatch** — Fixed a 3-way mismatch between `manifest-helper.js`, `constants.js`, and `check.js` that caused the updater to never locate the release ZIP asset.
2.  **[Critical] `isUpdating` / `isChecking` Getter Snapshot Bug** — Destructuring the exported getter on `require()` produced a one-time snapshot (always `false`). Refactored to re-read the getter via module reference on every IPC call.
3.  **[Critical] Missing File Copies in `directReplace`** — Renderer-only update path was silently missing `src/preload/`, `package.json`, and `manifest.current.json`. *(Note: `directReplace` was later removed entirely in favor of the external updater.)*
4.  **[Critical] External Updater Spawned in Wrong Mode** — `resources/updater.js` was spawned without `ELECTRON_RUN_AS_NODE=1`, causing the EXE to boot as an Electron app instead of executing the JS script.
5.  **[Critical] Version Prefix Comparison Chaos** — Added `normalizeVersion()` helper that strips the `v` prefix on both sides before comparing.
6.  **[Medium] Duplicated `DEFAULT_CONFIG` Across Two Files** — Refactored `config-manager.js` to import and merge from `constants.js` as single source of truth.
7.  **[Medium] Manifest Read Path Split Between Verifiers** — Unified to a candidate-path strategy (EXE directory first, app-root fallback).
8.  **[Medium] fs.watch Debounce Was Too Short** — Raised from 100ms to 500ms to suppress Windows double-change emit pattern.

### Pre-Release Code Review Fixes
The following fixes were identified through **3 rounds of cross-validation code review** (DeepSeek x2 + independent reviewers x2) conducted before the v0.2.2 release:

9.  **[High] Config Manager Double Broadcast** — `writeConfig` broadcast config changes, then `fs.watch` would broadcast the same change again 500ms later. Added `isSelfWrite` flag to skip self-triggered watch events. Also added proper debounce (`configChangeTimer`) to clear previous timers, and extended event listening to include `rename` (Windows editors that save via temp-file-then-rename).
10. **[High] Cache Deletion Could Remove New Version** — `registerCachedZip` sorted by `downloadedAt` only, potentially deleting a newly downloaded version instead of an old unused one. Fixed to prioritize deleting versions without `successFirstLaunchAt`, and exclude the just-registered version from cleanup.
11. **[High] Renderer Process `require('electron')` Crash** — `settings.js` contained `const { shell } = require('electron')` in the renderer process, which crashes under `nodeIntegration: false` + `contextIsolation: true`. The variable was also never used (dead code). Removed entirely.
12. **[High] `t()` Function Missing Parameter Interpolation** — `i18n.js`'s `t(key)` function ignored the second `params` argument, causing template variables like `{seconds}` and `{version}` to appear as literal text in update dialogs. Added parameter replacement support.
13. **[Medium] `settings.html` Duplicate DOM + URL Backticks** — The `official-url-box` section was duplicated, and the URL `value` attribute contained stray backtick characters. Removed the duplicate and fixed the URL.
14. **[Medium] `compareVersions` NaN Vulnerability** — `map(Number)` on non-numeric version segments produced `NaN`, silently treated as `0`. Added `isNaN` check with string comparison fallback.
15. **[Medium] `generate-manifest.js` Module Cache Pollution** — `require(package.json)` caches the object, potentially returning stale version metadata. Changed to `async fs.readJson()` for dynamic reads.
16. **[Medium] `closeLogSync` Redundant `closeSync`** — `resources/updater.js` called `fs.closeSync(fd)` after `logStream.end()`, risking `EBADF` errors and log loss. Removed the redundant `closeSync` call.
17. **[Medium] Download ZIP Missing Timeout** — `generate-manifest.js`'s `downloadAndHash` had no request timeout, potentially hanging indefinitely on slow networks. Added 60-second timeout.
18. **[Low] `substr` Deprecated API** — `storage-manager.js` used `String.prototype.substr` (deprecated). Changed to `slice`.
19. **[Low] `installer.js` Missing `cwd`** — `spawn` call for the external updater did not specify `cwd`, which could fail on paths with special characters. Added `cwd: path.dirname(process.execPath)`.
20. **[Low] `process.kill(pid, 0)` for Process Detection** — External updater's `waitForMainProcessExit` used `tasklist` command parsing, which was fragile on non-English Windows. Replaced with Node.js native `process.kill(pid, 0)` for cross-platform reliability.
21. **[Low] `build.win.target` Missing** — `package.json` lacked explicit `target` configuration, causing `electron-builder` to default to NSIS installer instead of ZIP. Added `"target": [{"target": "zip", "arch": ["x64"]}]`.

## ⚠️ Precautions

- After installing v0.2.2, if you have previously installed an older version (v0.1.0, v0.2.0 or v0.2.1), please open the older version first, manually migrate your note content and custom configurations to v0.2.2, and then delete the old version.

- **If you fail to save your data following this author-verified procedure, the author shall not be held liable for any data loss or corruption.**

---

**Sparklet** - Make note-taking simpler ✨

---
---
## 简体中文
# Sparklet v0.2.2 发布说明
*内部版本代号：Vapor · 水蒸气*

发布日期：2026 年 8 月 8 日

---

## 📦 下载后快速开始

从 GitHub Releases 页面下载这个文件：**`sparklet-v0.2.2-win-x86_64.zip`**（ZIP 绿色便携版 / 免安装）。

| | 操作说明 |
|---|---|
| **1. 解压** | **绝对不要在 ZIP 预览窗口里直接双击 Sparklet.exe！** 正确做法：右键 ZIP 文件 → **「全部解压…」** → 选择**不含中文和空格**的目标目录（例如 `D:\Apps\Sparklet\`）。 |
| **2. 启动** | 解压完成后打开解压出的文件夹，你会看到 `Sparklet.exe` 以及一堆 `*.dll` 文件和 `resources/` 文件夹。**双击 Sparklet.exe** 即可启动。 |
| **3. SmartScreen 提示** | 若弹出 Windows Defender SmartScreen「无法识别的应用」警告，点击 **「更多信息」→「仍要运行」**。该提示仅因压缩包未做数字签名产生，应用本身安全可用。 |
| **4. 快捷方式（可选）** | 右键 `Sparklet.exe` → **「发送到」→「桌面快捷方式」**，之后从桌面双击即可快速启动。 |

---

## ✨ 新增功能
1.  **自动更新系统** — 完整对接 GitHub Releases。包含版本检查、**完整 ZIP 包全量下载**（含进度回调）、SHA256 完整性校验，以及 asar 安全的外部更新器：
    -   **外部更新器（asar 安全）**：派生出独立的 Node 子进程（`ELECTRON_RUN_AS_NODE=1`），在主进程退出后替换所有文件。采用 Windows 安全的「重命名再写入」策略处理被锁文件（exe/dll/asar）。替换完成后自动重启应用。
    -   *注：之前的「直接替换（Direct Replace）」策略已移除，因为 asar 归档是只读的，无法在运行中的应用内原地修改。*
2.  **更新包缓存系统** — 下载的更新 ZIP 持久化保存在 `userData/update_cache/`，带有元数据追踪：
    -   **回滚支持** — 启动时完整性校验失败时，可从缓存的 ZIP 重新安装（通过 SHA256 校验），无需重新下载
    -   **保留策略** — 成功打开的版本保留用户可配置的 7~30 天；未成功使用的版本保留 30 天；最多同时缓存 2 个版本
    -   **智能清理** — 优先删除未成功使用的版本，排除刚注册的版本
    -   **设置面板集成** — 查看缓存信息、配置保留天数、刷新或清除缓存
3.  **启动完整性校验** — 基于 SHA256 的多层校验：可执行文件哈希（`exeHash`）+ 已安装文件组合哈希（`filesHash`）。本地 manifest 缺失时自动从云端 `manifest.releases.json` 兜底。校验失败触发回滚对话框，可选择从缓存重装或打开发布页面。
4.  **独立配置系统** — 按优先级依次扫描三个候选配置文件夹名（`SparkletConfig`、`sparklet-config`、`.sparkletconf`）。通过 `fs.watch` 实时监听文件变化（同时处理 Windows 下的 `change` 和 `rename` 事件），防抖广播配置变更到全窗口。自写检测避免冗余通知。
5.  **设置面板更新区** — 新增配置控件、状态展示和操作按钮：
    -   更新行为下拉：自动 / 仅通知 / 关闭
    -   检查频率下拉：重启后 / 30 分钟 / 1 小时 / 1 天 / 1 周
    -   文件完整性校验复选框
    -   更新包缓存区：保留天数滑杆（7~30 天）、缓存信息展示、刷新和清除按钮
    -   配置导入/导出：备份和还原更新设置为 JSON
    -   「立即检查」手动触发按钮
    -   「🌐 打开官网」按钮：默认浏览器跳转 GitHub 项目主页
    -   「官网地址复制」：一键复制项目 GitHub 网址，附带加速器使用提示
6.  **Toast 通知系统** — 主界面与设置面板均支持 Toast 反馈，兼容 i18n 多语言文案及参数插值。
7.  **开发环境检测** — 通过源码启动时（`!app.isPackaged`）自动关闭更新系统、锁定设置面板更新区块防止误操作，并显示 10 秒 Toast 提示。
8.  **项目结构重构** — 笔记模块整体下移到 `src/renderer/modules/note/`，为 v0.2.6+ 规划的多分页架构预留命名空间。

## 🎨 体验与视觉优化
1.  应用图标统一更换为 **icon256.ico**，内嵌 6 种尺寸：256×256 / 128×128 / 64×64 / 48×48 / 32×32 / 16×16，在各种 DPI 缩放下都清晰锐利。
2.  为设置面板新增「更新配置」分区样式，与整体玻璃拟态视觉语言保持一致。
3.  控制台输出全部改为英文，避免非 UTF-8 控制台窗口因编码问题出现乱码。
4.  重启对话框超时行为规范化：30 秒兜底倒计时，并在用户点击按钮后清理定时器。
5.  清理旧版自定义 HTML 更新对话框遗留的死代码，改为使用原生对话框。

## 🔧 技术与配置更新
1.  **版本信息**：语义版本升至 `0.2.2`，内部代号由 `Water` 改为 `Vapor`。
2.  **发布 ZIP 命名**：发布 ZIP 统一调整为带平台标识的 **`sparklet-vX.X.X-win-x86_64.zip`**。
3.  **构建配置**：`electron-builder` 配置 `win.target: zip`（仅 ZIP 便携版；NSIS 安装包可能在 v0.2.3 加入）。输出目录按版本组织为 **`release/v0.2.2/`**。
4.  **存储拆分**：笔记数据、全局配置、系统配置改为三个独立的 Electron Store 实例。
5.  **清单生成**：三阶段 `generate-manifest.js` 脚本分别生成 `exeHash`、`filesHash`、`packageHash`。通过 `fs.readJson` 动态读取 `package.json`（避免 Node 模块缓存污染）。
6.  **共享完整性规则**：`_integrity-rules.js` 提供文件过滤（黑名单）的单一数据源，生成端和运行端共用。
7.  **提交规范工具链**（v0.2.3 起正式启用）：集成 `@commitlint/cli` + `@commitlint/config-conventional` + `husky` 并通过 Git `commit-msg` 钩子强制执行。
8.  **依赖项**：新增生产依赖 `fs-extra`（文件系统工具）与 `unzipper`（流式 ZIP 解压）；新增开发依赖 commitlint 与 husky。

## 🐛 Bug 修复

### 开发阶段修复
以下修复在 v0.2.2 开发周期内完成：

1.  **[严重] ZIP 文件名正则三处不一致** — `manifest-helper.js`、`constants.js`、`check.js` 的 ZIP 资源匹配正则不一致，导致更新器每次都找不到发布资产。已三处统一对齐。
2.  **[严重] `isUpdating` / `isChecking` Getter 快照 Bug** — `require()` 时解构 getter 只会得到一次性快照（永远为 `false`）。重构为每次 IPC 调用都从模块引用重新读取。
3.  **[严重] `directReplace` 漏复制关键文件** — 渲染层仅更新分支原先静默漏掉了 `src/preload/`、`package.json`、`manifest.current.json`。*（注：`directReplace` 后已整体移除，统一走外部更新器。）*
4.  **[严重] 外部更新器以错误模式启动** — `resources/updater.js` 派生时未设置 `ELECTRON_RUN_AS_NODE=1`，EXE 会以 Electron 应用方式启动而非执行 JS 脚本。
5.  **[严重] 版本号前缀比较混乱** — 新增 `normalizeVersion()` 辅助函数：统一去掉两侧的 `v` 前缀后再比较。
6.  **[中等] 两份 `DEFAULT_CONFIG` 重复定义** — 改为 `config-manager.js` 从 `constants.js` 引入再合并，单一数据源。
7.  **[中等] 校验器之间 manifest 读取路径分裂** — 统一改为候选路径策略（优先 EXE 目录，兜底 app 根目录）。
8.  **[中等] fs.watch 防抖时间过短** — 从 100ms 提升至 500ms 避免 Windows 双 change 事件重复广播。

### 发布前代码审查修复
以下修复在 v0.2.2 发布前通过 **3 轮交叉验证代码审查**（DeepSeek x2 + 独立审查者 x2）发现并修复：

9.  **[高] 配置管理器双重广播** — `writeConfig` 广播配置变更后，`fs.watch` 会在 500ms 后再次广播同一变更。新增 `isSelfWrite` 标志跳过自身写入触发的事件。同时加入正确的防抖机制（`configChangeTimer` 清除上一个定时器），并扩展事件监听以包含 `rename`（Windows 下编辑器通过「写临时文件→重命名」保存时触发）。
10. **[高] 缓存删除可能误删新版本** — `registerCachedZip` 仅按 `downloadedAt` 排序，可能删掉刚下载的新版本而非旧的无用版本。修复为优先删除没有 `successFirstLaunchAt` 的版本，并排除刚注册的版本。
11. **[高] 渲染进程 `require('electron')` 崩溃** — `settings.js` 在渲染进程中使用 `const { shell } = require('electron')`，在 `nodeIntegration: false` + `contextIsolation: true` 下会崩溃。且该变量从未被使用（死代码）。已删除。
12. **[高] `t()` 函数缺少参数插值** — `i18n.js` 的 `t(key)` 函数忽略了第二个 `params` 参数，导致更新对话框中的模板变量如 `{seconds}` 和 `{version}` 显示为原始文本。已添加参数替换支持。
13. **[中等] `settings.html` 重复 DOM + URL 反引号** — `official-url-box` 区块被重复定义，且 URL 的 `value` 属性包含多余的反引号字符。已删除重复项并修复 URL。
14. **[中等] `compareVersions` NaN 漏洞** — 对非数字版本段执行 `map(Number)` 会产生 `NaN`，被静默当作 `0` 处理。新增 `isNaN` 检测，回退到字符串比较。
15. **[中等] `generate-manifest.js` 模块缓存污染** — `require(package.json)` 会缓存对象，可能返回旧版本元数据。改为 `async fs.readJson()` 动态读取。
16. **[中等] `closeLogSync` 多余的 `closeSync`** — `resources/updater.js` 在 `logStream.end()` 后又调用 `fs.closeSync(fd)`，可能导致 `EBADF` 错误和日志丢失。已移除多余的 `closeSync` 调用。
17. **[中等] 下载 ZIP 缺少超时** — `generate-manifest.js` 的 `downloadAndHash` 没有请求超时，慢网络下可能无限挂起。新增 60 秒超时。
18. **[低] `substr` 已废弃 API** — `storage-manager.js` 使用了已废弃的 `String.prototype.substr`。改为 `slice`。
19. **[低] `installer.js` 缺少 `cwd`** — 外部更新器的 `spawn` 调用未指定 `cwd`，在含特殊字符的路径下可能失败。新增 `cwd: path.dirname(process.execPath)`。
20. **[低] `process.kill(pid, 0)` 进程检测** — 外部更新器的 `waitForMainProcessExit` 使用 `tasklist` 命令解析，在非英文 Windows 上不够可靠。改用 Node.js 原生 `process.kill(pid, 0)` 实现跨平台可靠检测。
21. **[低] `build.win.target` 缺失** — `package.json` 缺少显式的 `target` 配置，导致 `electron-builder` 默认生成 NSIS 安装包而非 ZIP。新增 `"target": [{"target": "zip", "arch": ["x64"]}]`。

## ⚠️ 注意事项

- 解压使用 v0.2.2 版本后，若您曾使用过旧版本（v0.1.0、v0.2.0 或 v0.2.1），请先打开旧版本，手动将笔记内容与自定义配置迁移至 v0.2.2 中，再删除旧版本。

- **若未按照上述作者已验证的方案操作导致数据异常或丢失，作者概不负责。**

---

**Sparklet** - 让笔记更简单 ✨