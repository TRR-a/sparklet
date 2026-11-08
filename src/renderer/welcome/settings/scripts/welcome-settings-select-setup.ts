// Custom select: setup / option wiring [自定义下拉框 - 初始化与选项接线]

import { closeSelect, openSelect } from 'sparklet/renderer/welcome/settings/scripts/welcome-settings-select-open.js';

/** Wire a custom select container's trigger and options [接线下拉框触发器与选项点击] */
export function setupCustomSelect(
  containerId: string,
  onSelect: (value: string) => void,
): void {
  const container = document.getElementById(containerId);
  if (!container) return;
  const trigger = container.querySelector<HTMLButtonElement>('.custom-select-trigger');
  const options = container.querySelectorAll<HTMLElement>('.custom-select-option');
  if (!trigger) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    container.classList.contains('open') ? closeSelect(container) : openSelect(container);
  });

  options.forEach((opt) => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const value = opt.dataset.value || '';
      options.forEach((o) => o.classList.remove('selected'));
      opt.classList.add('selected');
      const label = container.querySelector('.custom-select-label');
      if (label) label.textContent = opt.textContent || '';
      container.dataset.value = value;
      closeSelect(container);
      onSelect(value);
    });
  });
}
