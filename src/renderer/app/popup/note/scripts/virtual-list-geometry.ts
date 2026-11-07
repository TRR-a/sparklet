// Virtual list geometry: heights, offsets, window binary search - barrel [虚拟列表几何 - 高度、偏移、窗口二分 - 汇总出口]
//
// Split out [已拆分]：height model → virtual-list-heights.ts,
// viewport & visible range → virtual-list-viewport.ts.

export {
  CARD_MARGIN,
  VIEWPORT_BUFFER,
  HEIGHT_ESTIMATES,
  heightKey,
  itemHeight,
  computeOffsets,
} from './virtual-list-heights.js';
export { getSidebar, computeRange } from './virtual-list-viewport.js';
