// Line diff for history snapshots: LCS [历史快照行级差异 - LCS 计算]

/** Diff output line [diff 输出行] */
export interface DiffLine {
  type: 'ctx' | 'add' | 'del';
  text: string;
}

/** LCS cell budget: beyond this fall back to plain preview (no diff) [LCS 预算：超出则退化为纯预览] */
const MAX_LCS_CELLS = 4_000_000;

/**
 * Line diff via LCS (custom implementation, no dependencies) [基于 LCS 的行级差异 (自研实现，无依赖)]
 */
export function diffLines(oldText: string, newText: string): DiffLine[] | null {
  const a = oldText.length ? oldText.split('\n') : [];
  const b = newText.length ? newText.split('\n') : [];
  if (a.length * b.length > MAX_LCS_CELLS) return null; // Too large, caller falls back [过大，调用方退化处理]

  // LCS length table [LCS 长度表]
  const n = a.length, m = b.length;
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // Walk the table to emit the diff [回溯表生成差异]
  const out: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: 'ctx', text: a[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'del', text: a[i] });
      i++;
    } else {
      out.push({ type: 'add', text: b[j] });
      j++;
    }
  }
  while (i < n) out.push({ type: 'del', text: a[i++] });
  while (j < m) out.push({ type: 'add', text: b[j++] });
  return out;
}
