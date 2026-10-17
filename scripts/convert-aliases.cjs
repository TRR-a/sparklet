// Batch-convert deep relative imports (../../../) to sparklet/ aliases in source .ts files
// [批量把源码中 3 层及以上的 ../ 相对 import 改成 sparklet/ 别名]
// Only converts paths with 3+ ../ segments; same-dir (./) and single-level (../) stay relative.
// [只转换 3 层及以上的路径；同层 ./ 和一层 ../ 保留相对路径]

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const MIN_DEPTH = 2; // Minimum ../ segments to convert [转换的最小 ../ 层数]

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

/**
 * Count leading ../ segments in a path [统计路径开头的 ../ 层数]
 */
function dotDotDepth(p) {
  let count = 0;
  let rest = p;
  while (rest.startsWith('../')) {
    count++;
    rest = rest.slice(3);
  }
  return count;
}

/**
 * Convert a relative import path to sparklet/ alias [把相对 import 路径转成 sparklet/ 别名]
 */
function toAlias(importPath, fileDir) {
  const resolved = path.resolve(fileDir, importPath);
  const relToSrc = path.relative(SRC_DIR, resolved).replace(/\\/g, '/');
  return 'sparklet/' + relToSrc;
}

// Patterns that carry an import path [携带 import 路径的模式]
const patterns = [
  /\bfrom\s+(['"])([^'"]+)\1/g,    // import ... from '...' / export ... from '...'
  /\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g, // dynamic import('...')
  /\brequire\s*\(\s*(['"])([^'"]+)\1\s*\)/g, // require('...')
];

let filesChanged = 0;
let importsConverted = 0;

for (const file of walk(SRC_DIR)) {
  let content = fs.readFileSync(file, 'utf8');
  const fileDir = path.dirname(file);
  let changed = false;

  for (const pattern of patterns) {
    content = content.replace(pattern, (match, quote, importPath) => {
      // Only convert relative paths starting with ../ and depth >= MIN_DEPTH
      // [只转换以 ../ 开头且层数 >= MIN_DEPTH 的相对路径]
      if (!importPath.startsWith('../')) return match;
      if (dotDotDepth(importPath) < MIN_DEPTH) return match;

      const alias = toAlias(importPath, fileDir);
      changed = true;
      importsConverted++;
      // Reconstruct the full match with the new path [用新路径重建完整匹配]
      if (match.startsWith('from')) return `from ${quote}${alias}${quote}`;
      if (match.startsWith('import')) return `import(${quote}${alias}${quote})`;
      if (match.startsWith('require')) return `require(${quote}${alias}${quote})`;
      return match;
    });
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    filesChanged++;
  }
}

console.log(`[convert-aliases] converted ${importsConverted} import(s) in ${filesChanged} file(s)`);
