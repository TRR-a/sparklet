// Note list: tag filter state [笔记列表 - 标签筛选状态]

/** Currently selected tag filter ('' = show all) [当前选中的标签筛选 (空 = 全部)] */
let activeTag = '';

/** Get the active tag filter [获取当前标签筛选] */
export function getActiveTag(): string { return activeTag; }

/** Set the active tag filter [设置当前标签筛选] */
export function setActiveTag(tag: string): void { activeTag = tag; }
