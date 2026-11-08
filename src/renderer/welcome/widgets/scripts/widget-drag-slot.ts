// Widget drag: slot geometry (drop preview) [卡片拖拽 - 落点几何 (预览)]

/**
 * Find the card the dragged one should move before (pointer geometry based)
 * [按指针几何找出拖拽卡片应移动到的目标卡之前的位置]
 * A card counts as "before the pointer" when the pointer sits in its upper half,
 * or left of its center within the lower half [指针位于卡片上半，或下半左侧，即视为在其之前]
 */
export function findBeforeCard(cards: HTMLElement[], ev: PointerEvent): HTMLElement | undefined {
  return cards.find((c) => {
    const r = c.getBoundingClientRect();
    return ev.clientY < r.top + r.height / 2
      || (ev.clientY < r.bottom && ev.clientX < r.left + r.width / 2);
  });
}

/**
 * Move the card into the drop slot (no-op moves are skipped to avoid reflows)
 * [把卡片移动到落点 (跳过无效移动以避免重排)]
 */
export function applyDropSlot(board: HTMLElement, card: HTMLElement, before: HTMLElement | undefined): void {
  // Skip no-op moves to avoid needless reflows per pointer frame
  // [跳过无效移动，避免每个指针帧触发无谓重排]
  const inPlace = before ? before.previousElementSibling === card
    : board.lastElementChild === card;
  if (inPlace) return;

  if (before) board.insertBefore(card, before);
  else board.appendChild(card);
}
