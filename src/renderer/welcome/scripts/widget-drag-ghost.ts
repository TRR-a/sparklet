// Widget drag: pointer-following ghost [卡片拖拽 - 跟随指针的幽灵]

/** Create the drag ghost clone from the card [从卡片克隆拖拽幽灵] */
export function createGhost(card: HTMLElement, rect: DOMRect): HTMLElement {
  const ghost = card.cloneNode(true) as HTMLElement;
  ghost.classList.add('dragging');
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  ghost.style.left = `${rect.left}px`;
  ghost.style.top = `${rect.top}px`;
  ghost.style.margin = '0';
  document.body.appendChild(ghost);
  return ghost;
}

/** Move the ghost by the pointer delta [按指针位移移动幽灵] */
export function moveGhost(ghost: HTMLElement, dx: number, dy: number): void {
  ghost.style.transform = `translate(${dx}px, ${dy}px)`;
}

/** Drop the ghost and clear the live-preview state [移除幽灵并清除预览状态] */
export function dropGhost(ghost: HTMLElement, card: HTMLElement): void {
  ghost.remove();
  card.classList.remove('slot-preview');
}
