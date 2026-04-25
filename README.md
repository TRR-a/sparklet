# Sparklet v0.2.1 （闪存）

## English

## ✨ Features

- **📝 Quick Note Creation** - One-click note creation with full support for title and content editing
- **🎨 Color Tagging** - Add color labels to notes for easy categorization and management
- **🗑️ Recycle Bin** - Secure note deletion with restore and permanent delete options
- **🌙 Theme Switching** - Full support for light and dark theme modes
- **🌍 Multi-language Support** - Built-in support for 9 languages (Chinese, English, Spanish, French, German, Portuguese, Russian, Japanese, Korean)
- **⚙️ Settings Management** - Personalized preferences, including language and theme settings
- **🪟 Window Controls** - Native support for window minimize, maximize, and close operations
- **💾 Local Storage** - Secure data persistence powered by Electron Store, all data is saved offline locally with no server upload.

## 🚀 Installation & Usage

### System Requirements

**Windows 10 / 11 only**
No macOS or Linux builds are available at this time.

### Project Status

This project **has not yet packaged or released a finished installer**. Currently, only open source code is provided, which requires a local development environment to run.
The official Windows one-click installer will be published to the [Releases](https://github.com/TRR-a/sparklet/releases) page with the stable official release.

### Run from Source Code

1. Clone the project source code to your local machine
2. Install Node.js 18+ environment
3. Open the project folder and install dependencies (npm install)
4. Launch the application (npm start)

```bash
# Clone the repository
git clone https://github.com/TRR-a/sparklet.git
cd sparklet

# Install dependencies
npm install

# Launch the application
npm start

## If you encounter an error during application startup, please install Electron globally first.
npm install -g electron

## Then install the project dependencies.
npm install

## Then start the app
npm start
```

### First Run

The app will automatically create a default note on first launch, and you can start writing immediately.

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
- Switch between light and dark mode

### Language Settings

1. Click the settings button (⚙️) to open the settings window
2. Select your preferred language from the dropdown menu
3. Settings take effect immediately

## 🛠️ Development

### Environment Requirements

- Node.js 18+
- npm or yarn

### Tech Stack

Electron + Vanilla JavaScript + nw.js

### Project Structure

```
sparklet/
├── src/
│   ├── main/          # Main process code
│   └── renderer/      # Renderer process code
│       ├── popup/     # Main interface window
│       ├── settings/  # Settings window
│       ├── about/     # About window
│       └── shared/    # Common utility modules
├── assets/            # Icons and static assets
├── build/             # Build and packaging configuration
└── package.json       # Project configuration file
```

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgements

- [Electron](https://electronjs.org/) - Cross-platform desktop application framework
- [electron-store](https://github.com/sindresorhus/electron-store) - Lightweight local data persistence solution
- [Visual Studio Code](https://code.visualstudio.com/) - Development and editing support

---

**Sparklet** - Make note-taking simpler ✨

---

## 简体中文

# Sparklet v0.2.1 （闪存）

## ✨ 功能特性

- **📝 快速笔记**：一键创建笔记，支持标题和内容编辑
- **🎨 颜色标记**：为笔记添加颜色标签，便于分类管理
- **🗑️ 回收站**：安全删除笔记，支持恢复功能
- **🌙 主题切换**：支持亮色和暗色主题
- **🌍 多语言支持**：内置9种语言（中文、英文、西班牙文、法文、德文、葡萄牙文、俄文、日文、韩文）
- **⚙️ 设置管理**：个性化设置，包括语言和主题偏好
- **🪟 窗口管理**：支持窗口最小化、最大化和关闭
- **💾 本地存储**：基于 Electron Store 实现安全数据持久化，所有数据均离线保存在本地，不会上传至任何服务器。

## 🚀 安装使用

### 系统要求
**仅支持 Windows 10 / 11**
目前暂无 macOS、Linux 版本适配

### 当前项目状态
本项目**暂未打包发布成品安装包**，现阶段仅提供开源源代码，需本地环境运行。
后续正式版本将会在 [Releases](https://github.com/TRR-a/sparklet/releases) 页面发布 Windows 一键安装包。

### 源码运行方式
1. 克隆本项目源码到本地
2. 安装 Node.js 18+ 环境
3. 打开项目文件夹，执行依赖安装(npm install)
4. 启动应用运行(npm start)

```bash
# 克隆项目
git clone https://github.com/TRR-a/sparklet.git
cd sparklet

# 安装依赖
npm install

# 启动应用
npm start

## 若启动报错，请先全局安装 Electron
npm install -g electron

## 再执行安装依赖
npm install

## 再启动应用
npm start
```

### 首次运行

应用会自动创建默认笔记，你可以立即开始记录。

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
- 在亮色和暗色主题间切换

### 语言设置

1. 点击设置按钮（⚙️）打开设置窗口
2. 在语言下拉菜单中选择您的语言
3. 设置会立即生效

## 🛠️ 开发说明

### 环境要求

- Node.js 18+
- npm 或 yarn

### 技术栈

Electron + 原生 JS + nw.js

### 项目结构

```
sparklet/
├── src/
│   ├── main/          # 主进程代码
│   └── renderer/      # 渲染进程代码
│       ├── popup/     # 主弹窗界面
│       ├── settings/  # 设置窗口
│       ├── about/     # 关于窗口
│       └── shared/    # 共享工具
├── assets/            # 图标和资源文件
├── build/             # 构建配置
└── package.json       # 项目配置
```

## 📄 许可证

本项目采用 MIT 许可证。

## 🙏 致谢

- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [electron-store](https://github.com/sindresorhus/electron-store) - 简单的数据持久化
- [Visual Studio Code](https://code.visualstudio.com/) - 提供开发支持

---

**Sparklet** - 让笔记更简单 ✨