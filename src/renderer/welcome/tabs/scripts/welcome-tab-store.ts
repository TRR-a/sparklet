// Welcome tabs: tab id counter + data map [欢迎页标签 - id 计数与数据表]

let tabCounter = 1;

export interface TabData {
  title: string;
}

export const tabData = new Map<number, TabData>();

/** Allocate a new tab id [分配新的标签 id] */
export function nextTabId(): number {
  return tabCounter++;
}

/** Store tab data for an id [保存标签数据] */
export function putTabData(id: number, data: TabData): void {
  tabData.set(id, data);
}

/** Drop tab data by id [按 id 删除标签数据] */
export function dropTabData(id: number): void {
  tabData.delete(id);
}
