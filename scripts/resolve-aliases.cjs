// Resolve sparklet/ path aliases in compiled JS files (tsc does not do this)
// [在编译后的 JS 文件中解析 sparklet/ 路径别名 (tsc 不做这件事)]
// Runs after tsc in the build pipeline. Handles static import, dynamic
// import(), require(), and re-exports.
// [在构建流程中 tsc 之后执行。处理静态 import、动态 import()、require() 和再导出]

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const ALIAS_PREFIX = 'sparklet/';
const ALIAS_TARGET = path.join(BUILD_DIR, 'src'); // sparklet/ -> build/src/

/**
 * Walk directory and collect all .js files [遍历目录收集所有 .js 文件]
 */
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

/**
 * Replace sparklet/alias with relative path in a single file [在单个文件中把 sparklet/ 别名替换为相对路径]
 */
function resolveFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const fileDir = path.dirname(file);

  // Match any quoted string starting with sparklet/ — covers import/export/require/dynamic import
  // [匹配任何以 sparklet/ 开头的引号字符串 — 覆盖 import/export/require/动态 import]
  const pattern = /(['"])(sparklet\/[^'"]+)\1/g;
  let changed = false;

  const newContent = content.replace(pattern, (match, quote, alias) => {
    const target = path.join(ALIAS_TARGET, alias.slice(ALIAS_PREFIX.length));
    let rel = path.relative(fileDir, target);
    // path.relative on Windows uses backslashes; normalize to forward slashes for import paths
    // [Windows 下 path.relative 用反斜杠，import 路径需要正斜杠]
    rel = rel.replace(/\\/g, '/');
    // Ensure relative paths start with ./ or ../ [确保相对路径以 ./ 或 ../ 开头]
    if (!rel.startsWith('.')) rel = './' + rel;
    changed = true;
    return `${quote}${rel}${quote}`;
  });

  if (changed) {
    fs.writeFileSync(file, newContent, 'utf8');
    return 1;
  }
  return 0;
}

// Main [主流程]
if (!fs.existsSync(BUILD_DIR)) {
  console.error('[resolve-aliases] build/ directory not found, run tsc first');
  process.exit(1);
}

const files = walk(BUILD_DIR);
let resolved = 0;
for (const file of files) {
  resolved += resolveFile(file);
}

console.log(`[resolve-aliases] resolved sparklet/ aliases in ${resolved}/${files.length} JS file(s)`);
