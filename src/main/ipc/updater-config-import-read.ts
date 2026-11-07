// Updater config import: read payload [更新配置导入 - 读取文件负载]

import * as fs from 'fs-extra';

/** Read the picked JSON file; null payload + error message on parse failure [读取选中的 JSON；解析失败返回 null 负载与错误信息] */
export async function readImportedPayload(
  file: string
): Promise<{ payload: Record<string, unknown> | null; error: string | null }> {
  try {
    const payload = await fs.readJson(file);
    return { payload, error: null };
  } catch (parseErr) {
    const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
    return { payload: null, error: '文件不是合法的 JSON：' + msg };
  }
}
