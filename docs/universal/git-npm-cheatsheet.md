# Git & npm Cheatsheet [Git 与 npm 命令速查表]

> Commonly used + less common commands, with key flags. Annotations are English first, Chinese in `[ ]`.
> [常用与小众命令，含关键参数。注释以英文为主，中文在方括号里。]

---

## 1. Git

### 1.1 Setup & Config [配置]

| Command | Description | Examples / Flags |
|---|---|---|
| `git config` | Read/write config [读写配置] | `git config --global user.name "Name"`; `--list` / `-l`; `--global` / `--local` / `--system` |
| `git init` | Start a new repo [初始化仓库] | `git init -b main` (set initial branch) |
| `git clone` | Copy a remote repo [克隆远程仓库] | `git clone <url>`; `--depth=1` (shallow); `-b <branch>` |
| `git help <cmd>` | Manual for a command [查看命令手册] | `git help gc` |

### 1.2 Daily Basics [日常]

| Command | Description | Examples / Flags |
|---|---|---|
| `git status` | Working tree state [工作区状态] | `-s` short; `-b` branch |
| `git add` | Stage changes [暂存改动] | `git add -A` all; `git add -p` patch mode; `-u` tracked only [只加已跟踪文件的改动] |
| `git commit` | Commit staged [提交] | `-m "msg"`; `-a` skip add; `--amend`; `--no-edit`; `-F <file>` |
| `git diff` | Unstaged changes [未暂存差异] | `git diff --staged` staged; `--stat` summary; `a..b` between commits [两提交对比]; `a...b` from merge-base [与共同祖先对比] |
| `git restore` | Discard/unstage files [还原/取消暂存] | `git restore <file>`; `--staged <file>` unstage; `--source=<ref> <file>` from any commit [从任意提交还原] |
| `git rm` | Remove file & untrack [删除并取消跟踪] | `git rm <file>`; `--cached` untrack only, keep on disk [只取消跟踪不删文件] |
| `git mv` | Move/rename a tracked file [移动/重命名已跟踪文件] | `git mv old new` |
| `.gitignore` | Ignore patterns [忽略规则] | — |

### 1.3 Branching [分支]

| Command | Description | Examples / Flags |
|---|---|---|
| `git branch` | List/create branches [分支列表/创建] | `-a` all; `-d <b>` delete; `-m old new` rename; `--merged` / `--no-merged` filter merged [已合并/未合并] |
| `git switch` | Switch branch [切换分支] | `git switch main`; `-c <b>` create+switch (modern) |
| `git checkout` | Switch / restore (legacy) [旧版切换/还原] | `git checkout -b <b>` |
| `git merge` | Merge branch [合并] | `--no-ff`; `--squash`; `--abort` |
| `git rebase` | Replay commits on top [变基] | `git rebase main`; `-i` interactive; `--continue`/`--abort`/`--skip`; `--onto <new> <old> <topic>` precise retarget [精确变基] |
| `git cherry-pick` | Pick one commit [挑拣单个提交] | `git cherry-pick <sha>`; `-n` no-commit |
| `git tag` | Version tags [标签] | `-a v1.0 -m "msg"` annotated; `-l -n` list tags with annotation messages [列出标签并显示注释内容]; `git push --tags` |

### 1.4 Remote [远程]

| Command | Description | Examples / Flags |
|---|---|---|
| `git remote` | Manage remotes [远程仓库] | `-v` list; `add origin <url>`; `set-url` |
| `git fetch` | Download refs [拉取引用] | `--prune` prune gone branches |
| `git pull` | fetch + merge [拉取并合并] | `--rebase` (pull with rebase) |
| `git push` | Upload commits [推送] | `-u origin <b>`; `--force-with-lease` (safer force); `--tags`; `origin <local>:<remote>` refspec — push to a differently named remote branch [本地分支推到不同名的远程分支] |
| `git ls-remote` | List remote refs without cloning [不克隆查看远程引用] | `--heads`; `--tags` |

### 1.5 Undo & Repair [撤销与修复]

| Command | Description | Examples / Flags |
|---|---|---|
| `git reset` | Move HEAD / index [重置 HEAD/索引] | `--soft` keep changes staged; `--mixed` (default) unstage; `--hard` discard; `--hard origin/<b>` align with remote [对齐远端分支] |
| `git revert` | New commit that undoes [反向生成提交] | `git revert <sha>` (safe for shared history) |
| `git stash` | Shelve changes [暂存现场] | `push -m "msg"`; `pop`; `list`; `drop`; `apply` |
| `git clean` | Remove untracked files [清未跟踪文件] | `-n` dry-run; `-fd` force delete; `-fdX` also ignored |
| `git checkout -- <file>` | Discard file changes [丢弃文件改动] | legacy form of restore |

### 1.6 History & Inspection [历史与查看]

| Command | Description | Examples / Flags |
|---|---|---|
| `git log` | Commit history [提交历史] | `--oneline`; `--graph`; `--all`; `-p` patch; `--author`; `--since`; `-<n>` last n; `-S"str"` pickaxe — commits where the string appeared/disappeared [字符串出现/消失的提交]; `-G"re"` regex version [正则版]; `--follow <file>` trace renames [跨重命名跟踪文件] |
| `git reflog` | HEAD movement history (recovery gold) [HEAD 移动记录，找回丢失提交] | `git reflog -n` |
| `git blame` | Who changed each line [逐行作者] | `git blame <file>`; `-L <n>,<m>` line range [只看指定行范围] |
| `git show` | Show a commit [查看提交详情] | `git show <sha>`; `git show <sha>:<file>` file at that commit [该提交时的文件内容] |
| `git shortlog` | Grouped commit summary [按作者汇总] | `-sn` count commits per author |
| `git bisect` | Binary search bad commit [二分查找引入 bug 的提交] | `start`; `bad <sha>`; `good <sha>`; `reset`; `run <cmd>` auto-bisect via exit code [按命令退出码自动二分] |
| `git describe` | Nearest tag + distance [最近的 tag 及其距离，版本定位] | `--tags`; `git describe --always` fallback to SHA [无 tag 时退回 SHA] |

### 1.7 Maintenance & Internals [维护与底层 — 小众但实用]

| Command | Description | Flags / Notes |
|---|---|---|
| `git gc` | Garbage collect & pack objects [打包对象、清理无用文件、压缩仓库] | `--aggressive` thorough recompress (slow, one-off); `--auto` heuristic; `--prune=now` prune unreachable now; `--prune=<date>` |
| `git count-objects` | Report repo size [报告仓库大小/对象数] | `-v` verbose; `-H` human-readable sizes (e.g. `git count-objects -vH`) |
| `git fsck` | Check repo integrity [检查仓库完整性] | `--unreachable` list dangling; `--lost-found` |
| `git prune` | Delete unreachable objects [删除不可达对象，通常 gc 已带] | `--dry-run` |
| `git reflog expire` | Expire old reflog entries [清理旧 reflog] | `--expire=now --all` |
| `git repack` | Repack objects manually [手动重打包] | `-ad` all into one pack; `-d` prune old packs |
| `git rev-parse` | Resolve refs to SHA [解析引用为 SHA] | `HEAD`; `--short`; `git rev-parse --abbrev-ref HEAD` (current branch) |
| `git update-index` | Index manipulation [索引操作] | `--skip-worktree <f>`; `--assume-unchanged <f>` |
| `git submodule` | Manage submodules [子模块] | `add`; `update --init --recursive`; `foreach` |
| `git filter-repo` | Rewrite history: strip large files, dead code [重写历史：剔除大文件/死代码] | `--path <f> --invert-paths` keep everything except; pip install git-filter-repo first [需先 pip 安装]; modern replacement for filter-branch [filter-branch 的现代替代] |
| `git cat-file` | Inspect raw objects [查看底层对象内容] | `cat-file -p <sha>` pretty-print blob/commit [友好打印内容] |

### 1.8 Misc [杂项]

| Command | Description | Notes |
|---|---|---|
| `git worktree` | Multiple working trees [多工作区同仓库] | `add <path> <branch>` |
| `git switch -c` / `git checkout -b` | Create branch [建分支] | — |
| `git commit --fixup <sha>` | Prepare fixup commit [准备修正提交] | used with `rebase -i --autosquash` |
| `git config --global pull.rebase true` | Pull with rebase by default [默认 pull 用 rebase] | — |
| `git archive` | Export a snapshot archive [导出快照压缩包] | `git archive --format=zip -o out.zip HEAD`; `HEAD~3` any ref [任意引用] |
| `git bundle` | Offline repo transfer via file [离线打包传输整个仓库] | `create f.bundle main`; receiver: `git clone f.bundle` [接收方克隆] |
| `git sparse-checkout` | Partial checkout of huge repos [大仓库部分检出] | `git sparse-checkout set <dir>`; `--cone` faster mode [更快模式] |
| `git rerere` | Reuse recorded conflict resolutions [复用记录过的冲突解法] | `git config rerere.enabled true`; auto-replays on repeated conflicts [重复冲突自动套用] |

---

## 2. npm & npx

### 2.1 Install / Uninstall [安装/卸载]

| Command | Description | Flags |
|---|---|---|
| `npm install` (`npm i`) | Install deps from package-lock [按 lock 安装依赖] | `-g` global; `--save-dev` / `-D`; `--save` / `-S`; `<pkg>@<version>`; `--omit=dev` skip dev deps [不装开发依赖] |
| `npm ci` | Clean install from lock (CI) [严格按 lock 全新安装，删 node_modules] | use in CI; fails if lock out of sync |
| `npm uninstall` (`npm un`) | Remove package [卸载] | `-g` global |
| `npm update` | Update within semver [更新依赖] | `<pkg>` specific; `-g` global; `npm outdated` to preview |
| `npm dedupe` | Flatten duplicate deps [扁平化重复依赖] | shrinks node_modules |
| `npm prune` | Remove extraneous packages [删除不在 package.json 的包] | `--production` dev deps too |

### 2.2 Run Scripts [运行脚本]

| Command | Description | Notes |
|---|---|---|
| `npm run <script>` | Run package.json script [运行脚本] | `npm run` (no args) lists all scripts |
| `npx <cmd>` | Run a binary without global install [临时运行包内命令，不全局安装] | `-y` skip prompt; `<pkg>@<ver>` pin version [指定版本]; `-p <pkg> <cmd>` combine several packages [组合多包运行]; `--no-install` local only, never fetch [只用本地已装] |
| `npm exec` | Programmatic twin of npx [npx 的底层命令，可编程调用] | `npm exec -- <cmd> [args]`; `--yes` |
| `npm init <initializer>` | Scaffold via create-* packages [脚手架] | `npm init vite@latest my-app` = `create-vite` [等价 create-vite] |
| `npm start` / `npm test` / `npm stop` | Lifecycle shortcuts [生命周期简写] | alias for run |

### 2.3 Inspect [查看]

| Command | Description | Flags |
|---|---|---|
| `npm list` (`npm ls`) | Dependency tree [依赖树] | `--depth=0` direct only; `-g` global; `<pkg>` filter |
| `npm explain <pkg>` | Why a package is installed — full dependency chain [为何安装此包，完整依赖链] | alias `npm why` [别名 npm why] |
| `npm view <pkg>` | Registry metadata [查看包信息/版本] | `version`; `versions`; `maintainers` |
| `npm outdated` | Show outdated deps [列出过期依赖] | `-g` global |
| `npm diff` | Diff installed deps vs registry / between versions [对比已装依赖与 registry 或两版本] | `npm diff --diff=<pkg>`; `--diff=<a> --diff=<b>` [两版本对比] |
| `npm pkg` | Read/write package.json fields [读写 package.json 字段] | `npm pkg get scripts`; `npm pkg set scripts.foo="cmd"` |
| `npm info <pkg>` | Alias of view [view 的别名] | — |
| `npm config` | Read/write npm config [配置] | `list`; `get registry`; `set registry <url>` |
| `npm root -g` | Global node_modules path [全局 node_modules 路径] | — |
| `npm cache` | Manage cache [缓存] | `clean --force`; `verify` |
| `npm ping` | Test registry connectivity [测 registry 连通性] | — |

### 2.4 Publish & Pack [发布与打包]

| Command | Description | Flags |
|---|---|---|
| `npm login` / `npm logout` | Registry auth session [登录/登出 registry] | `--registry <url>` for private registries [私有源] |
| `npm whoami` | Show logged-in user [查看当前登录身份] | check auth before publish [发布前自检] |
| `npm publish` | Publish to registry [发布包] | `--dry-run`; `--access public` scoped; `--tag next` |
| `npm pack` | Make tarball without publishing [打包成 tgz 不发布] | inspect contents |
| `npm version` | Bump version [改版本号] | `patch`/`minor`/`major`; `-m "msg"`; `-no-git-tag-version` |
| `npm dist-tag` | Manage dist-tags (latest/next/…) [管理分发标签] | `ls`; `add <pkg>@<ver> next`; `rm <pkg> old` |
| `npm deprecate` | Mark package deprecated [标记废弃] | `<pkg>@<range> "msg"` |

### 2.5 Security & Maintenance [安全与维护 — 小众但实用]

| Command | Description | Flags |
|---|---|---|
| `npm audit` | Scan for vulnerabilities [漏洞扫描] | `--json`; `npm audit fix` auto-fix; `--force` (may break); `fix --dry-run` |
| `npm fund` | Show package funding info [显示赞助信息] | — |
| `npm ls <pkg> --all` | Who depends on X [谁依赖了某包] | dependency tree |
| `npm dedupe` | Collapse duplicates [去重] | see 2.1 |
| `npm cache verify` | Verify cache integrity [校验缓存] | — |
| `npm rebuild` | Recompile native addons [重编译原生模块] | after Node upgrade |
| `npm doctor` | Health check install [环境体检] | — |
| `npm link` | Symlink a local package for dev [本地包符号链接联调] | in lib: `npm link`; in app: `npm link <pkg>`; undo with `npm unlink` [取消] |

### 2.6 Common flags cheat [常用参数对照]

| Flag | Meaning |
|---|---|
| `-g` | global install/lookup [全局] |
| `-D` / `--save-dev` | devDependencies [开发依赖] |
| `-S` / `--save` | dependencies (default in npm 5+) [生产依赖] |
| `--save-exact` | pin exact version, no ^ [锁死精确版本] |
| `--legacy-peer-deps` | ignore peer conflicts [忽略 peer 冲突] |
| `--no-audit` / `--no-fund` | skip audit/fund on install [装包时跳过审计/资金提示] |
| `--omit=<group>` | skip a dep group [跳过依赖组] (`--omit=dev` / `--omit=peer`) |
| `--engine-strict` | enforce `engines` field strictly [严格校验 engines 版本] |
| `--prefix <path>` | run as if in another project [在指定目录执行] |

**package.json fields worth knowing [值得了解的 package.json 字段]**

| Field | Meaning |
|---|---|
| `overrides` | Force a dependency's version across the tree [强制依赖树中某包的版本] `"overrides": {"pkg": "1.2.3"}` |
| `engines` | Required Node/npm versions [要求的 Node/npm 版本] |
| `peerDependencies` | Host must provide these [宿主环境需提供的依赖] |
