# Sparklet v0.2.2 （Vapor · 水蒸气）

## English

## ✨ Features

- **📝 Quick Note Creation** - One-click note creation with full support for title and content editing
- **🎨 Color Tagging** - Add color labels to notes for easy categorization and management
- **🗑️ Recycle Bin** - Secure note deletion with restore and permanent delete options
- **🌙 Theme Switching** - Full support for light and dark theme modes, synchronized across all windows
- **🌍 Multi-language Support** - Built-in support for 9 languages (Chinese, English, Spanish, French, German, Portuguese, Russian, Japanese, Korean)
- **⚙️ Settings Management** - Personalized preferences, including language, theme, update behavior, check frequency, integrity check switch
- **🪟 Window Controls** - Native-style traffic light window buttons with fully customizable window control logic
- **💾 Local Storage** - Secure data persistence powered by Electron Store. Notes / global config / system config stored independently. All data is saved offline locally with no server upload.
- **🔄 Auto Update System** - Full GitHub Releases integration: version check → **full ZIP package download** with progress callbacks → SHA256 integrity verification → external updater (asar-safe, applies after main process quits) → automatic restart
- **📦 Update Package Cache** - Downloaded update ZIPs are persisted in `userData/update_cache/`. Supports rollback from cached ZIP when integrity check fails. Retention policy: successfully launched versions kept for N days (user-configurable 7~30); unused versions kept for 30 days; max 2 versions cached.
- **🛡️ Startup Integrity Check** - SHA256-based multi-layer verification on every launch: executable hash (`exeHash`) + installed files combined hash (`filesHash`). Cloud manifest fallback when local manifest is missing. Failed checks trigger rollback dialog.
- **📂 Independent Config System** - Three candidate config folders + `fs.watch` real-time monitoring (handles both `change` and `rename` events) + config change broadcast across all windows. Debounced to prevent duplicate broadcasts. Self-write detection avoids redundant notifications.
- **🔗 Official URL Copy** - One-click copy of the project GitHub URL from the settings panel, with a hint about using an accelerator for GitHub access in mainland China.
- **🍞 Toast Notification System** - Toast feedback supported on both the main window and the settings panel.
- **🧑‍💻 Dev Environment Detection** - Automatically disables the update system, locks the UI update section, and shows a 10-second Toast reminder when running from source.
- **🌐 Open Official Site Button** - One-click access to the GitHub project page from the settings panel.

## 🚀 Get Started

### System Requirements

**Windows 10 / 11 only**
No macOS or Linux builds are available at this time.

### Current Project Status

Starting from **v0.2.2**, official Windows release builds are published to the
[Releases](https://github.com/TRR-a/sparklet/releases) page.

Current release file name: **`sparklet-v0.2.2-win-x86_64.zip`**
Build output directory: `release/v0.2.2/`

### Download & Run ZIP (Recommended for Users)

Release file: **`sparklet-v0.2.2-win-x86_64.zip`** (ZIP Portable / Green / No-install version)

1. Open the [Releases](https://github.com/TRR-a/sparklet/releases) page
2. Download the latest `sparklet-v0.2.2-win-x86_64.zip`
3. **CRITICAL — NEVER double-click Sparklet.exe inside the Explorer ZIP preview window!** The correct way: right-click the ZIP → **"Extract All…"** → choose a destination folder that contains **NO Chinese characters or spaces** (e.g. `D:\Apps\Sparklet\`). Running directly from inside the compressed preview will cause update failures, missing config files, and other bizarre issues.
4. After extraction, open the unzipped folder. You will see `Sparklet.exe` plus a bunch of `*.dll` files, a `resources/` folder, etc.
5. **Double-click Sparklet.exe** to launch.
   - If Windows Defender SmartScreen warns "unrecognized app", click **"More info" → "Run anyway"**. The warning appears because the package is not digitally signed; the app itself is clean and safe to use.
6. *(Optional)* Right-click `Sparklet.exe` → **"Send to" → "Desktop (create shortcut)"** so you can launch it from the desktop later.

From v0.2.2 onward, the app has a built-in updater that performs automatic **full-package updates** (it downloads the complete ZIP each time, then uses an external updater to safely replace all files after the main process quits — no need to manually re-download and re-extract).

### Run from Source Code

1. Clone the project source code to your local machine
2. Install Node.js 18+ environment
3. Open the project folder and install dependencies (`npm install`)
4. Launch the application (`npm start`)

```bash
# Clone the repository
git clone https://github.com/TRR-a/sparklet.git
cd sparklet

# Install dependencies
npm install

# Launch the application
npm start

# If you get an error during app startup, install Electron globally first
npm install -g electron

# Then install project dependencies again
npm install

# Then start the app again
npm start
```

### First Launch

The app automatically creates a default note on first launch — you can start writing right away.
In development mode (running from source), a 10-second Toast will remind you that the update feature is disabled.

## 📖 Usage Guide

### Create a Note

1. Click the "+ New Note" button in the bottom left corner of the main interface
2. Enter your note title and content
3. Optional: Select a color label for categorization
4. Your note is auto-saved in real time

### Edit a Note

- Click any note in the left note list to load and edit it
- All changes to the title or content are auto-saved instantly

### Delete a Note

- Click the delete button (🗑️) on the right side of the note
- The note will be moved to the Recycle Bin, where you can restore it or permanently delete it

### Switch Theme

- Click the theme toggle button on the right side of the title bar
- Switch between light and dark mode. All windows (main, settings, about) stay in sync.

### Language Settings

1. Click the settings button (⚙️) to open the settings window
2. Select your preferred language from the dropdown menu
3. Settings take effect immediately across all windows

### Update Settings (New in v0.2.2)

1. Open the settings window (⚙️)
2. **Update Behavior**: Choose from
   - `Auto` — Automatically download updates and prompt to restart
   - `Notify Only` — Only check and notify, no auto-download
   - `Disabled` — Disable auto-update entirely
3. **Check Frequency**: On Startup / 30 min / 1 hour / 1 day / 1 week
4. **Integrity Check**: Toggle SHA256 integrity check on application startup
5. **Check Now**: Manually trigger an immediate update check
6. **🌐 Open Official Site**: Visit the GitHub project page in your default browser
7. **📦 Update Cache**: View cached update package info, configure retention days (7~30), refresh or clear cache

### Precautions

- After installing v0.2.2, if you have previously installed an older version (v0.1.0, v0.2.0 or v0.2.1), please open the older version first, manually migrate your note content and custom configurations to v0.2.2, and then delete the old version.

- **If you fail to save your data following this author-verified procedure, the author shall not be held liable for any data loss or corruption.**

## 🛠️ Development

### Environment Requirements

- Node.js 18+
- npm or yarn
- Windows 10 / 11 (For building Windows release ZIPs)

### Tech Stack

Electron + Vanilla JavaScript

### Project Structure

```
sparklet/
├── src/
│   ├── main/                 # Main process (Electron)
│   │   ├── index.js          # Entry: window creation, IPC registration, updater init
│   │   ├── preload/          # contextBridge preload scripts
│   │   └── updater/          # Auto update module (v0.2.2+)
│   │       ├── index.js          # Updater orchestration entry
│   │       ├── check.js          # GitHub Releases version check
│   │       ├── download.js       # ZIP download + progress
│   │       ├── installer.js      # External updater dispatch (asar-safe)
│   │       ├── verify.js         # SHA256 multi-layer integrity verification
│   │       ├── cache-manager.js  # Update package persistent cache + rollback
│   │       ├── config-manager.js # Persistent user config storage + fs.watch
│   │       ├── manifest-helper.js# manifest.current / manifest.releases reader
│   │       ├── temp-manager.js   # Temporary directory management
│   │       ├── constants.js      # Shared constants & defaults
│   │       └── _integrity-rules.js # Shared file filtering rules (used by both
│   │                              #   generate-manifest.js and verify.js)
│   └── renderer/             # Renderer process (pure HTML/CSS/JS)
│       └── modules/note/     # Note module (namespace for future multi-tab v0.2.6+)
│           ├── popup/        # Main interface window
│           ├── settings/     # Settings window (updater section included)
│           ├── about/        # About window
│           └── shared/       # i18n locales + common utilities
├── assets/                   # Icons and static assets (icon256.ico with sizes 256/128/64/48/32/16)
├── resources/                # Extra runtime resources (updater.js for external updates)
├── scripts/                  # Helper scripts (generate-manifest.js)
├── release/                  # Build output (release/v0.2.2/)
├── .husky/                   # Git hooks (commit-msg for commitlint)
├── commitlint.config.js      # Conventional Commits rules (effective from v0.2.3)
├── RELEASE.md                # Version changelog
└── package.json              # Project configuration
```

### Build Commands

```bash
# Pack into directory (unpacked only, no ZIP or installer)
npm run pack

# Build distribution ZIP
npm run dist

# Generate SHA256 manifest files (manifest.current.json + manifest.releases.json)
npm run generate-manifest
```

### Commit Convention

Starting from **v0.2.3**, all commits must follow the Conventional Commits standard:

```
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Formatting only (no code change)
refactor: Refactoring (no feature / fix)
perf:     Performance
test:     Tests
build:    Build system / dependencies
ci:       CI config
chore:    Misc
revert:   Revert commit
```

The project uses `commitlint` + `husky` to enforce the format automatically on commit.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgements

- [Electron](https://electronjs.org/) - Cross-platform desktop application framework
- [electron-store](https://github.com/sindresorhus/electron-store) - Lightweight local data persistence solution
- [fs-extra](https://github.com/jprichardson/node-fs-extra) - Enhanced file system utilities
- [unzipper](https://github.com/ZJONSSON/node-unzipper) - Streaming ZIP extraction
- [commitlint](https://commitlint.js.org/) / [husky](https://typicode.github.io/husky/) - Commit message quality
- [Visual Studio Code](https://code.visualstudio.com/) - Development and editing support

---

**Sparklet** - Make note-taking simpler ✨

---

## 简体中文

# Sparklet v0.2.2 （Vapor · 水蒸气）

## ✨ 功能特性

- **📝 快速笔记**：一键创建笔记，支持标题和内容编辑
- **🎨 颜色标记**：为笔记添加颜色标签，便于分类管理
- **🗑️ 回收站**：安全删除笔记，支持恢复与永久删除
- **🌙 主题切换**：支持亮色和暗色主题，全窗口实时同步
- **🌍 多语言支持**：内置9种语言（中文、英文、西班牙文、法文、德文、葡萄牙文、俄文、日文、韩文）
- **⚙️ 设置管理**：个性化设置，包括语言、主题、更新行为、检查频率、完整性校验开关
- **🪟 窗口管理**：Mac 风格红绿灯按钮，完整自定义窗口控制逻辑
- **💾 本地存储**：基于 Electron Store 实现安全数据持久化，**笔记数据 / 全局配置 / 系统配置相互独立**。所有数据均离线保存在本地，不会上传至任何服务器。
- **🔄 自动更新系统**：完整对接 GitHub Releases：版本检查 → **完整 ZIP 包全量下载**（含进度回调）→ SHA256 完整性校验 → 外部更新器（asar 安全，主进程退出后替换文件）→ 自动重启
- **📦 更新包缓存**：下载的更新 ZIP 持久化保存在 `userData/update_cache/`。完整性校验失败时可从缓存回滚安装。保留策略：成功打开的版本保留 N 天（用户可配置 7~30 天）；未成功使用的版本保留 30 天；最多同时缓存 2 个版本。
- **🛡️ 启动完整性校验**：每次启动基于 SHA256 多层校验：可执行文件哈希（`exeHash`）+ 已安装文件组合哈希（`filesHash`）。本地 manifest 缺失时自动从云端兜底。校验失败触发回滚对话框。
- **📂 独立配置系统**：三个候选配置文件夹 + `fs.watch` 实时监听（同时处理 `change` 和 `rename` 事件）+ 全窗口配置变化广播。防抖机制避免重复广播，自写检测避免冗余通知。
- **🔗 官网地址复制**：设置面板一键复制项目 GitHub 网址，附带国内访问 GitHub 建议使用加速器的提示。
- **🍞 Toast 通知系统**：主界面与设置面板均支持 Toast 反馈。
- **🧑‍💻 开发环境检测**：源码运行时自动禁用更新系统、锁定设置 UI 的更新区块，并显示 10 秒 Toast 提示。
- **🌐 打开官网按钮**：设置面板一键跳转 GitHub 项目主页。

## 🚀 快速开始

### 系统要求
**仅支持 Windows 10 / 11**
目前暂无 macOS、Linux 版本适配。

### 当前项目状态

从 **v0.2.2** 起，官方 Windows 发布构建已上传至
[Releases](https://github.com/TRR-a/sparklet/releases) 页面。

当前发布文件名：**`sparklet-v0.2.2-win-x86_64.zip`**
打包输出目录：`release/v0.2.2/`

### 下载 ZIP 并运行（推荐用户使用）

发布文件：**`sparklet-v0.2.2-win-x86_64.zip`**（ZIP 绿色便携版 / 免安装 / 解压即用）

1. 打开 [Releases](https://github.com/TRR-a/sparklet/releases) 页面
2. 下载最新的 `sparklet-v0.2.2-win-x86_64.zip`
3. **非常重要 —— 绝对不要在资源管理器的 ZIP 预览窗口里直接双击 Sparklet.exe！** 正确做法：右键 ZIP 文件 → **「全部解压…」** → 选择**不含中文和空格**的目标目录（例如 `D:\Apps\Sparklet\`）。在压缩包预览里直接运行会导致更新失败、配置文件找不到等各种诡异问题。
4. 解压完成后打开解压出的文件夹，你会看到 `Sparklet.exe` 以及一堆 `*.dll` 文件、`resources/` 文件夹等。
5. **双击 Sparklet.exe** 即可启动。
   - 若弹出 Windows Defender SmartScreen 提示「无法识别的应用」，点击 **「更多信息」→「仍要运行」**。该提示仅因压缩包未做数字签名产生，应用本身是安全可用的。
6. *（可选）* 右键 `Sparklet.exe` → **「发送到」→「桌面快捷方式」**，之后从桌面双击即可快速启动。

从 v0.2.2 起，应用内置更新器会自动进行**全量包更新**（每次下载完整 ZIP，然后通过外部更新器在主进程退出后安全替换所有文件 —— 无需用户手动重新下载解压）。

### 源码运行方式
1. 克隆本项目源码到本地
2. 安装 Node.js 18+ 环境
3. 打开项目文件夹，执行依赖安装（`npm install`）
4. 启动应用运行（`npm start`）

```bash
# 克隆项目
git clone https://github.com/TRR-a/sparklet.git
cd sparklet

# 安装依赖
npm install

# 启动应用
npm start

# 若启动报错，请先全局安装 Electron
npm install -g electron

# 再重新安装依赖
npm install

# 再启动应用
npm start
```

### 首次启动

应用会自动创建默认笔记，你可以立即开始记录。
开发模式（源码运行）下会弹出 10 秒 Toast 提示开发环境更新功能已禁用。

## 📖 使用指南

### 创建笔记

1. 点击主界面左下角的 "+ 新建笔记" 按钮
2. 输入笔记标题和内容
3. 选择颜色标签（可选）
4. 笔记会自动保存

### 编辑笔记

- 点击左侧笔记列表中的任意笔记进行编辑
- 修改标题或内容后会自动保存

### 删除笔记

- 点击笔记右侧的删除按钮（🗑️）
- 笔记会移至回收站，可在回收站中恢复或永久删除

### 主题切换

- 点击标题栏右侧的主题切换按钮
- 在亮色和暗色主题间切换，主窗口、设置、关于窗口全窗口同步

### 语言设置

1. 点击设置按钮（⚙️）打开设置窗口
2. 在语言下拉菜单中选择您的语言
3. 设置会立即生效，全窗口实时同步

### 更新设置（v0.2.2 新增）

1. 打开设置窗口（⚙️）
2. **更新行为**：可选
   - `自动` — 自动下载更新并提示重启
   - `仅通知` — 只检查并弹窗提醒，不自动下载
   - `关闭` — 完全禁用自动更新
3. **检查频率**：重启后 / 30 分钟 / 1 小时 / 1 天 / 1 周
4. **完整性校验**：开关每次启动时的 SHA256 应用完整性检查
5. **立即检查**：手动触发一次立即更新检查
6. **🌐 打开官网**：默认浏览器跳转 GitHub 项目主页
7. **📦 更新包缓存**：查看缓存更新包信息、配置保留天数（7~30 天）、刷新或清除缓存

### 注意事项

- 解压使用 v0.2.2 版本后，若您曾使用过旧版本（v0.1.0、v0.2.0 或 v0.2.1），请先打开旧版本，手动将笔记内容与自定义配置迁移至 v0.2.2 中，再删除旧版本。

- **若未按照上述作者已验证的方案操作导致数据异常或丢失，作者概不负责。**

## 🛠️ 开发说明

### 环境要求

- Node.js 18+
- npm 或 yarn
- Windows 10 / 11（用于构建 Windows 发布 ZIP）

### 技术栈

Electron + 原生 JavaScript

### 项目结构

```
sparklet/
├── src/
│   ├── main/                 # 主进程（Electron）
│   │   ├── index.js          # 入口：窗口创建 / IPC 注册 / 更新器初始化
│   │   ├── preload/          # contextBridge 预加载脚本
│   │   └── updater/          # 自动更新模块（v0.2.2 起引入）
│   │       ├── index.js          # 更新器编排入口
│   │       ├── check.js          # GitHub Releases 版本检查
│   │       ├── download.js       # ZIP 下载 + 进度回调
│   │       ├── installer.js      # 外部更新器分派（asar 安全）
│   │       ├── verify.js         # SHA256 多层完整性校验
│   │       ├── cache-manager.js  # 更新包持久缓存 + 回滚
│   │       ├── config-manager.js # 用户配置持久化存储 + fs.watch
│   │       ├── manifest-helper.js# manifest.current / manifest.releases 读取
│   │       ├── temp-manager.js   # 临时目录管理
│   │       ├── constants.js      # 共享常量与默认值
│   │       └── _integrity-rules.js # 共享文件过滤规则（生成端和运行端共用）
│   └── renderer/             # 渲染进程（纯 HTML/CSS/JS）
│       └── modules/note/     # 笔记模块
│           ├── popup/        # 主界面窗口
│           ├── settings/     # 设置窗口（含更新器面板）
│           ├── about/        # 关于窗口
│           └── shared/       # 多语言资源 + 通用工具
├── assets/                   # 图标与静态资源（icon256.ico，含 256/128/64/48/32/16 多尺寸）
├── resources/                # 额外运行时资源（外部更新脚本 updater.js）
├── scripts/                  # 辅助脚本（生成清单文件 generate-manifest.js）
├── release/                  # 打包输出（release/v0.2.2/）
├── .husky/                   # Git Hooks（commit-msg 提交格式校验）
├── commitlint.config.js      # Conventional Commits 规则（从 v0.2.3 正式启用）
├── RELEASE.md                # 版本更新记录
└── package.json              # 项目配置
```

### 构建命令

```bash
# 仅打包为目录（仅 unpacked，不出 ZIP）
npm run pack

# 构建发布 ZIP
npm run dist

# 生成 SHA256 清单文件（manifest.current.json + manifest.releases.json）
npm run generate-manifest
```

### 提交规范

从 **v0.2.3** 起，所有提交必须遵循 Conventional Commits 标准：

```
feat:     新功能
fix:      Bug 修复
docs:     文档
style:    仅格式化（不改变代码含义）
refactor: 重构（非新功能非修复）
perf:     性能优化
test:     测试
build:    构建系统 / 依赖
ci:       CI 配置
chore:    杂项
revert:   回退提交
```

项目通过 `commitlint` + `husky` 在提交时自动强制校验。

## 📄 许可证

本项目采用 MIT 许可证。

## 🙏 致谢

- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [electron-store](https://github.com/sindresorhus/electron-store) - 轻量级数据持久化
- [fs-extra](https://github.com/jprichardson/node-fs-extra) - 增强文件系统工具
- [unzipper](https://github.com/ZJONSSON/node-unzipper) - 流式 ZIP 解压
- [commitlint](https://commitlint.js.org/) / [husky](https://typicode.github.io/husky/) - 提交信息质量保障
- [Visual Studio Code](https://code.visualstudio.com/) - 提供开发支持

---

**Sparklet** - 让笔记更简单 ✨