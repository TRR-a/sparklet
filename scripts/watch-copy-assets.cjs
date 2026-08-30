// watch-copy-assets.cjs
// Watch non-compiled assets (HTML/CSS/JSON/images/fonts) and incrementally sync into build/.
// 监听非编译资源 (HTML/CSS/JSON/图片/字体) 并增量同步到 build/。
//
// Complements watch:main/watch:renderer (which only emit .js). Run alongside them so edits to
// HTML/CSS/locale JSON are reflected in build/ without a manual `npm run build:copy`.
// 与 watch:main/watch:renderer (只产出 .js) 互补：改了 HTML/CSS/语言 JSON 后自动同步进 build/，无需手动跑 build:copy。
const fs = require('fs');
const path = require('path');
const { STATIC_EXT, COPY_ROOTS, OUT, copyAllAssets } = require('./build-copy-assets.cjs');

const ROOT = path.resolve(__dirname, '..');

/**
 * Handle a single watch event: copy on add/modify, delete dest on remove/move-away.
 * [处理单个 watch 事件：新增/修改→复制；删除/移走→删除目标]
 */
function handleEvent(fromRoot, toPrefix, filename) {
  if (!filename) return;
  const srcFile = path.join(fromRoot, filename);
  const ext = path.extname(srcFile).toLowerCase();
  if (!STATIC_EXT.has(ext)) return; // ignore non-static (e.g. .ts/.js) [忽略非静态资源]

  const dest = path.join(OUT, toPrefix, filename);
  const relSrc = path.relative(ROOT, srcFile);

  if (fs.existsSync(srcFile)) {
    // File exists (add/modify) → copy [文件存在 (新增/修改) → 复制]
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(srcFile, dest);
    console.log(`[watch-copy] + ${relSrc}`);
  } else if (fs.existsSync(dest)) {
    // File missing (delete/move-away) → remove dest [文件不存在 (删除/移走) → 删除目标]
    fs.unlinkSync(dest);
    console.log(`[watch-copy] - ${path.relative(ROOT, dest)}`);
  }
}

// Initial full sync so build/ starts fresh, then watch for incremental changes.
// [启动时先全量同步一次保证起点一致，再开始增量监听]
const initial = copyAllAssets();
console.log(`[watch-copy] initial sync: ${initial} asset(s) copied`);

const watchers = [];
for (const { from, to } of COPY_ROOTS) {
  const srcRoot = path.join(ROOT, from);
  if (!fs.existsSync(srcRoot)) continue;
  const w = fs.watch(srcRoot, { recursive: true }, (eventType, filename) => {
    handleEvent(srcRoot, to, filename);
  });
  w.on('error', (err) => console.error('[watch-copy] watch error:', err.message));
  watchers.push(w);
  console.log(`[watch-copy] watching ${from}/ -> build/${to}/`);
}
console.log('[watch-copy] incremental asset sync active. Press Ctrl+C to stop.');
