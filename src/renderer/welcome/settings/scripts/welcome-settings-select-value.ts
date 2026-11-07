// Custom select: value setter [自定义下拉框 - 值设置]

/** Set a custom select's displayed value without triggering callback [设置下拉框显示值（不触发回调）] */
export function setCustomSelectValue(containerId: string, value: string, label?: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.dataset.value = value;
  const selected = container.querySelector(`.custom-select-option[data-value="${value}"]`);
  container.querySelectorAll('.custom-select-option').forEach((o) => o.classList.remove('selected'));
  if (selected) selected.classList.add('selected');
  const labelEl = container.querySelector('.custom-select-label');
  if (labelEl) labelEl.textContent = label || selected?.textContent || '';
}
