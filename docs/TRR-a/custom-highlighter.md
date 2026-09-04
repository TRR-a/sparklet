# 自定义高亮与代码编辑器（替换 highlight.js + CodeMirror）

> 提交：feat: replace highlight.js with custom highlighter（笔记侧）
> 提交：refactor: replace CodeMirror with custom textarea-overlay editor（项目侧）

## 背景

项目原有两处第三方高亮/编辑依赖：

| 依赖 | 用途 | 体积 |
|------|------|------|
| highlight.js ^11.12 | 笔记 Markdown 代码块高亮 | vendor bundle (minified) |
| CodeMirror 6 + 7 个 lang 包 | 项目文件预览编辑器 | 1.1 MB bundle |

按「自定义实现优于第三方库」的项目偏好，全部替换为自研实现，零第三方依赖。

## 架构

```
src/renderer/core/highlight.ts      统一高亮器（唯一实现，两处共用）
  ├─ highlightJson / highlightMarkdown
  ├─ highlightCStyle (ts/js/css/py 方言配置)
  ├─ highlightHtml
  ├─ highlightCode(code, lang)      路由入口
  └─ getLanguageForFile(fileName)   扩展名 → 语言 ID

src/renderer/modules/project/code-editor.ts   自研代码编辑器
  └─ createCodeEditor(parent, opts) → { getValue, focus, destroy }
```

依赖方向保持 `modules/note → src/renderer/core` 单向：

- [markdown.ts](../modules/note/Modules/markdown.ts) → `core/highlight.js`（笔记代码块）
- [project-preview.ts](../src/renderer/modules/project/project-preview.ts) → `core/highlight.js` + `code-editor.js`

## 编辑器实现（textarea + overlay）

```
.code-editor (flex row)
  .code-editor-gutter        行号槽（overflow hidden + translateY 同步）
  .code-editor-scroll
    .code-editor-highlight   <pre><code> 高亮层（pointer-events: none）
    .code-editor-input       <textarea> 透明文本 + 可见光标（z-index 在上）
```

关键点：

- **度量一致**：pre 与 textarea 同字体/字号/行高/padding/tab-size，保证逐字符对齐
- **滚动同步**：textarea scroll 事件 → pre.scrollTop/scrollLeft + gutter translateY
- **不软换行**（`white-space: pre` + `wrap="off"`）：折行会让逻辑行高度不确定，导致行号错位；采用 VS Code 默认的横向滚动方案
- **末行占位**：内容以 `\n` 结尾时补一行空行，防止最后一行被滚动裁切
- **Mod-S**：textarea keydown 拦截 Ctrl/Cmd+S 触发保存回调
- **脏状态**：input 事件 → onChange 回调 → 文件名旁 `●` 指示点（沿用原样式）

## 语言支持

| 语言 | 扩展名 | 词元 |
|------|--------|------|
| TS/JS | ts/tsx/js/jsx/mjs/cjs | 注释（//、/\*\*\/）、模板字符串、字符串、数字、关键字、函数调用、label |
| CSS | css/scss/less | 块注释、属性名、#id、@规则、数字 |
| Python | py | # 注释、关键字、字符串、数字 |
| HTML | html/htm/svg/xml | 注释、标签、属性、字符串 |
| JSON | json/jsonc | 键/字符串（向后探测 `:` 区分）、数字、字面量 |
| Markdown | md/markdown | 标题/粗斜体/行内代码/引用/列表/围栏/链接/图片/裸 URL |

## 关键决策

1. **输出 hljs-\* 类名**：[editor.css](../modules/note/popup/editor.css) 已有 light/dark/blue 三套主题的 hljs 配色，自研高亮器直接复用，主题切换零成本（类名随 body[data-theme] 变色，无需重渲染）
2. **方言配置而非语言实例**：C 风格语言共用单遍 tokenizer，仅行注释前缀/模板串/关键字集不同
3. **保存失败就地错误条**：原 `alert()` 违反「禁用原生弹窗」约束，改为 `.file-preview-save-error` 顶部条（3 秒自动消失），避免 src/renderer 反向依赖 note 侧 toast
4. **XSS**：所有词元经 escapeHtml 转义后再拼 span，冒烟测试覆盖 `<script>` 注入用例

## 移除清单

- 依赖：highlight.js、codemirror、@codemirror/lang-{css,html,javascript,json,markdown,python}、@codemirror/language-data、@codemirror/theme-one-dark（共 9 包）
- 脚本：build:vendor（esbuild 打包链）；`build` 链相应缩短
- 文件：src/renderer/vendor/、modules/note/vendor/、project-codemirror.ts、modules/note/Modules/highlight.ts
