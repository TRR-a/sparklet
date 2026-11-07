// Virtual list: spacer elements [虚拟列表 - 上下占位元素]

/** Top spacer preserving the height above the window [窗口上方高度的占位] */
const topSpacer = document.createElement('li');
topSpacer.className = 'virtual-spacer';

/** Bottom spacer preserving the height below the window [窗口下方高度的占位] */
const bottomSpacer = document.createElement('li');
bottomSpacer.className = 'virtual-spacer';

export function getTopSpacer(): HTMLElement { return topSpacer; }
export function getBottomSpacer(): HTMLElement { return bottomSpacer; }
