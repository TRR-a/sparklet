// Glass dropdown: DOM scaffolding [玻璃下拉 - DOM 结构搭建]

/** Create and insert the dropdown button + panel next to the select [创建下拉按钮与面板并插入 select 旁] */
export function createDropdownDom(select: HTMLSelectElement): { btn: HTMLButtonElement; panel: HTMLDivElement } {
  select.style.display = 'none';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'glass-dropdown-btn';
  btn.innerHTML = '<span class="gd-label"></span><svg class="gd-arrow" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>';

  const panel = document.createElement('div');
  panel.className = 'glass-dropdown-panel';
  panel.style.display = 'none';

  select.parentNode!.insertBefore(btn, select);
  select.parentNode!.insertBefore(panel, select.nextSibling);

  return { btn, panel };
}
