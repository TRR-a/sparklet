---
## English
# Sparklet v0.2.2 Release Notes
*Internal Codename: Vapor · 水蒸气*

Release Date: August 2, 2026

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
1.  **Auto Update System** - Full integration with GitHub Releases. Includes version check, **full ZIP package download** with progress callbacks, SHA256 integrity verification, and two update strategies:
    -   **Renderer-Only Update (Direct Replace)** - Copies `src/renderer/`, `src/preload/`, `assets/`, `package.json`, and `manifest.current.json` in-place when main process code is unchanged
    -   **Main-Process-Safe Update (External Updater)** - Spawns a detached Node process (`ELECTRON_RUN_AS_NODE=1`) to replace `src/main/`, waits for the app to exit, swaps directories, then restarts the app
2.  **Startup File Integrity Verification** - SHA256-based multi-layer check. Checks `src/main/*.js`, `src/preload/*.js`, `src/renderer/modules/note/*.html` against a local manifest, and falls back to the cloud `manifest.releases.json` if local is missing. Failure triggers a native dialog alert.
3.  **Independent Configuration System** - Three candidate config directory names (`SparkletConfig`, `sparklet-config`, `.sparkletconf`) scanned in order. Real-time file change monitoring via `fs.watch` with config-change broadcast to all windows. Editing the config JSON by hand syncs the UI immediately.
4.  **Settings Panel Update Section** - Added three configuration controls, one status panel and two action buttons:
    -   Update Behavior dropdown: Auto / Notify Only / Disabled
    -   Check Frequency dropdown: On Startup / 30 min / 1 hour / 1 day / 1 week
    -   File Integrity Check checkbox
    -   Last checked time / Current version / Latest version status display
    -   "Check Now" manual trigger button
    -   **Open Official Site Button** (🌐) - Opens the GitHub project homepage in the default browser
5.  **Toast Notification System** - Toast feedback now supported on both the main window (popup) and the settings panel. Supports localized i18n messages.
6.  **Dev Environment Detection** - When launched via source code (`!app.isPackaged`), the update system is automatically disabled, the settings update section UI is locked to prevent mis-clicks, and a 10-second Toast reminder is displayed. The configuration file is also overridden for development safety.
7.  **Project Structure Refactor** - Moved the entire note module down to `src/renderer/modules/note/`, reserving a namespace for the planned v0.2.6+ multi-tab architecture.

## 🎨 Experience & Visual Improvements
1.  Updated application icon to **icon256.ico** with 6 embedded sizes: 256×256 / 128×128 / 64×64 / 48×48 / 32×32 / 16×16 for sharp rendering across all DPI scalings.
2.  Added a settings sub-section style for the Update configuration area, matching the glassmorphism visual language.
3.  Changed all console log output to English to avoid encoding corruption and garbled text on non-UTF-8 console windows.
4.  Standardized the restart dialog timeout behavior — a 30-second countdown that cleans its own timer on user action.
5.  Cleaned up dead code paths left over from the legacy custom HTML-based update dialog (`updater:show-dialog` / `sendUpdateResponse` IPC handlers) and switched to native `dialog.showMessageBox`.

## 🔧 Technical & Configuration Updates
1.  **Version Information**: Semantic version updated to `0.2.2`, internal codename renamed from `Water` to `Vapor`.
2.  **Package Naming**: Release ZIP renamed from the legacy `Sparklet-vX.X.X.zip` pattern to the platform-aware convention **`sparklet-vX.X.X-win-x86_64.zip`**.
3.  **Build Output**: `electron-builder` output directory now follows the versioned path **`release/v0.2.2/`**, matching the ZIP naming scheme.
4.  **Storage Splitting**: Note data, global configuration, and system configuration are now stored as three separate Electron Store instances to avoid coupling and reduce cross-module corruption risk.
5.  **Commit Quality Tooling** (effective from v0.2.3): Integrated `@commitlint/cli` + `@commitlint/config-conventional` + `husky` via Git `commit-msg` hook. All future commits must follow the Conventional Commits standard.
6.  **Dependencies**: Added `fs-extra` (file system utilities) and `unzipper` (streaming ZIP extraction) production dependencies. Added commitlint and husky dev dependencies.

## 🐛 Bug Fixes
All fixes listed below were verified and shipped in the v0.2.2 release pipeline (merged into commit #21).

1.  **[Critical] ZIP Filename Regex Mismatch** — Fixed a 3-way mismatch between `manifest-helper.js`, `constants.js`, and `check.js` that caused the updater to never locate the release ZIP asset, returning "no update available" on every check.
2.  **[Critical] `isUpdating` / `isChecking` Getter Snapshot Bug** — Destructuring the exported getter on `require()` produced a one-time snapshot (always `false`). Refactored the main process to re-read the getter via the module reference on every IPC call so the settings panel reflects real update status.
3.  **[Critical] Missing File Copies in `directReplace`** — The renderer-only update path previously only copied `src/renderer/` and `assets/`, silently missing `src/preload/`, `package.json`, and `manifest.current.json`. Added all three to the copy list so renderer-only updates now fully synchronize version state.
4.  **[Critical] External Updater Spawned in Wrong Mode** — `resources/updater.js` was spawned via `process.execPath` (the packaged Electron EXE) without `ELECTRON_RUN_AS_NODE=1`, causing the EXE to boot as an Electron app instead of executing the JS script. Added the environment variable to force pure-Node execution.
5.  **[Critical] Version Prefix Comparison Chaos** — `verifyInstalledFiles` was prepending `v` to `getCurrentVersion()` before lookup, while manifest entries may use either form. Added a `normalizeVersion()` helper that strips the `v` prefix on both sides before comparing, eliminating false "hash source not found" branches.
6.  **[Medium] Duplicated `DEFAULT_CONFIG` Across Two Files** — `constants.js` and `config-manager.js` each defined their own copy, and the `constants.js` copy was missing `integrityCheck: true`. Refactored `config-manager.js` to import and merge from the constants copy so there is now a single source of truth.
7.  **[Medium] Manifest Read Path Split Between Verifiers** — `selfCheckIntegrity` looked for `manifest.current.json` next to `Sparklet.exe`, while `readCurrentManifest()` looked under `app.getAppPath()`. Unified to a candidate-path strategy (EXE directory first, app-root fallback) so both verifiers read the same file.
8.  **[Medium] fs.watch Debounce Was Too Short** — 100 ms debounce in the config watcher was frequently hit by the Windows double-change emit pattern on save. Raised to 500 ms to suppress duplicate broadcasts.
9.  **[Minor] Uncleaned Timeout in Restart Dialog** — The 30-second fallback timer in `showRestartDialog` fired even after the user pressed a button. Added a `handled` guard flag and explicit `clearTimeout` on resolve.

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

发布日期：2026 年 8 月 2 日

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
1.  **自动更新系统** — 完整对接 GitHub Releases。包含版本检查、**完整 ZIP 包全量下载**（含进度回调）、SHA256 完整性校验以及两种更新应用方式：
    -   **仅渲染层更新（Direct Replace）**：当主进程代码未变化时，原地覆盖 `src/renderer/`、`src/preload/`、`assets/`、`package.json` 以及 `manifest.current.json`
    -   **含主进程安全更新（External Updater）**：派生出独立的 Node 子进程（`ELECTRON_RUN_AS_NODE=1`）负责替换 `src/main/`，等待主程序退出、完成目录替换后再自动重启应用
2.  **启动文件完整性校验** — 基于 SHA256 的双层校验：对照本地 manifest 校验 `src/main/*.js`、`src/preload/*.js`、`src/renderer/modules/note/*.html`，本地缺失时自动从云端 `manifest.releases.json` 兜底。校验失败会弹出原生对话框告警。
3.  **独立配置系统** — 按优先级依次扫描三个候选配置文件夹名（`SparkletConfig`、`sparklet-config`、`.sparkletconf`）。通过 `fs.watch` 实时监听文件变化并向全窗口广播配置变更，手动改配置 JSON 后界面会立即自动同步。
4.  **设置面板更新区** — 新增三个配置控件、一组状态展示以及两个操作按钮：
    -   更新行为下拉：自动 / 仅通知 / 关闭
    -   检查频率下拉：重启后 / 30 分钟 / 1 小时 / 1 天 / 1 周
    -   文件完整性校验复选框
    -   上次检查时间 / 当前版本 / 最新版本状态展示
    -   「立即检查」手动触发按钮
    -   「🌐 打开官网」按钮：默认浏览器跳转 GitHub 项目主页
5.  **Toast 通知系统** — 主界面（popup）与设置面板均支持 Toast 反馈，兼容 i18n 多语言文案。
6.  **开发环境检测** — 通过源码启动时（`!app.isPackaged`）自动关闭更新系统、锁定设置面板更新区块防止误操作，并显示 10 秒 Toast 提示。配置文件内容也会同步覆盖以保证开发安全。
7.  **项目结构重构** — 笔记模块整体下移到 `src/renderer/modules/note/`，为 v0.2.6+ 规划的多分页架构预留命名空间。

## 🎨 体验与视觉优化
1.  应用图标统一更换为 **icon256.ico**，内嵌 6 种尺寸：256×256 / 128×128 / 64×64 / 48×48 / 32×32 / 16×16，在各种 DPI 缩放下都清晰锐利。
2.  为设置面板新增「更新配置」分区样式，与整体玻璃拟态视觉语言保持一致。
3.  控制台输出全部改为英文，避免非 UTF-8 控制台窗口因编码问题出现乱码。
4.  重启对话框超时行为规范化：30 秒兜底倒计时，并在用户点击按钮后清理定时器。
5.  清理旧版自定义 HTML 更新对话框遗留的死代码（`updater:show-dialog` / `sendUpdateResponse` 等 IPC 通道），改为使用原生 `dialog.showMessageBox`。

## 🔧 技术与配置更新
1.  **版本信息**：语义版本升至 `0.2.2`，内部代号由 `Water` 改为 `Vapor`。
2.  **发布 ZIP 命名**：发布 ZIP 由旧格式 `Sparklet-vX.X.X.zip` 统一调整为带平台标识的 **`sparklet-vX.X.X-win-x86_64.zip`**。
3.  **构建输出路径**：`electron-builder` 输出目录按版本组织为 **`release/v0.2.2/`**，与 ZIP 命名规则呼应。
4.  **存储拆分**：笔记数据、全局配置、系统配置改为三个独立的 Electron Store 实例，降低模块耦合与跨模块损坏风险。
5.  **提交规范工具链**（v0.2.3 起正式启用）：集成 `@commitlint/cli` + `@commitlint/config-conventional` + `husky` 并通过 Git `commit-msg` 钩子强制执行，后续所有提交必须遵循 Conventional Commits 规范。
6.  **依赖项**：新增生产依赖 `fs-extra`（文件系统工具）与 `unzipper`（流式 ZIP 解压）；新增开发依赖 commitlint 与 husky。

## 🐛 Bug 修复
以下修复全部在 v0.2.2 发布管线内完成（合并到第 21 次提交中）。

1.  **[严重] ZIP 文件名正则三处不一致** — `manifest-helper.js`、`constants.js`、`check.js` 的 ZIP 资源匹配正则不一致，导致更新器每次都找不到发布资产，检查永远返回「暂无更新」。现已三处统一对齐为 `sparklet-v\d+\.\d+\.\d+-win-x86_64\.zip`。
2.  **[严重] `isUpdating` / `isChecking` Getter 快照 Bug** — `require()` 时解构 getter 只会得到一次性快照（永远为 `false`）。重构主进程改为每次 IPC 调用都从模块引用重新读取 getter，设置面板现在能实时反映更新状态。
3.  **[严重] `directReplace` 漏复制关键文件** — 渲染层仅更新分支原先只复制 `src/renderer/` 和 `assets/`，静默漏掉了 `src/preload/`、`package.json`、`manifest.current.json`。已将三项全部加入复制列表，渲染层更新现在能完全同步版本状态。
4.  **[严重] 外部更新器以错误模式启动** — `resources/updater.js` 通过 `process.execPath`（打包后的 Electron EXE）派生时未设置 `ELECTRON_RUN_AS_NODE=1`，EXE 会以 Electron 应用方式启动而非执行 JS 脚本。已添加环境变量强制以纯 Node 模式执行。
5.  **[严重] 版本号前缀比较混乱** — `verifyInstalledFiles` 在查询前给 `getCurrentVersion()` 硬拼 `v`，但 manifest 条目的 version 可能是任意形式。新增 `normalizeVersion()` 辅助函数：统一去掉两侧的 `v` 前缀后再比较，消除误命中「未找到 hash 来源」分支的问题。
6.  **[中等] 两份 `DEFAULT_CONFIG` 重复定义** — `constants.js` 与 `config-manager.js` 各自维护一份，而 `constants.js` 那份还漏了 `integrityCheck: true`。已改为 `config-manager.js` 从常量模块引入再合并，从此只有单一数据源。
7.  **[中等] 校验器之间 manifest 读取路径分裂** — `selfCheckIntegrity` 在 `Sparklet.exe` 旁边找 `manifest.current.json`，而 `readCurrentManifest()` 去 `app.getAppPath()` 下找。统一改为候选路径策略（优先 EXE 目录，兜底 app 根目录），两边现在读取的是同一个文件。
8.  **[中等] fs.watch 防抖时间过短** — 配置监听的 100ms 防抖在 Windows 上保存文件时经常被双 change 事件命中。提升至 500ms 避免重复广播。
9.  **[轻微] 重启对话框定时器未清理** — `showRestartDialog` 的 30 秒兜底定时器在用户点按钮后仍然触发。新增 `handled` 守卫 + 显式 `clearTimeout`。

## ⚠️ 注意事项

- 解压使用 v0.2.2 版本后，若您曾使用过旧版本（v0.1.0、v0.2.0 或 v0.2.1），请先打开旧版本，手动将笔记内容与自定义配置迁移至 v0.2.2 中，再删除旧版本。

- **若未按照上述作者已验证的方案操作导致数据异常或丢失，作者概不负责。**

---

**Sparklet** - 让笔记更简单 ✨
