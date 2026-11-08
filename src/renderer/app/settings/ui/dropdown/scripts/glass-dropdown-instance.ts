// Glass dropdown: one upgraded <select> instance [玻璃下拉 - 单个被升级的 select 实例]
//
// Split out [已拆分]：DOM scaffolding → glass-dropdown-dom.ts,
// value sync observers → glass-dropdown-observe.ts.

import { buildDropdownPanel } from 'sparklet/renderer/app/settings/ui/dropdown/scripts/glass-dropdown-panel.js';
import { positionDropdownPanel } from 'sparklet/renderer/app/settings/ui/dropdown/scripts/glass-dropdown-position.js';
import { syncDropdownLabel } from 'sparklet/renderer/app/settings/ui/dropdown/scripts/glass-dropdown-label.js';
import { createDropdownDom } from 'sparklet/renderer/app/settings/ui/dropdown/scripts/glass-dropdown-dom.js';
import { observeSelectValue } from 'sparklet/renderer/app/settings/ui/dropdown/scripts/glass-dropdown-observe.js';

export class GlassDropdown {
  private select: HTMLSelectElement;
  private btn: HTMLButtonElement;
  private panel: HTMLDivElement;
  private open = false;

  constructor(select: HTMLSelectElement) {
    this.select = select;
    const { btn, panel } = createDropdownDom(select);
    this.btn = btn;
    this.panel = panel;

    this.btn.addEventListener('click', () => this.toggle());
    document.addEventListener('click', (e) => {
      if (!this.btn.contains(e.target as Node) && !this.panel.contains(e.target as Node)) {
        this.close();
      }
    });

    this.syncFromSelect();
    observeSelectValue(select, () => this.syncFromSelect());
  }

  private syncFromSelect(): void {
    syncDropdownLabel(this.select, this.btn);
    this.buildPanel();
  }

  private buildPanel(): void {
    buildDropdownPanel(this.select, this.panel, () => this.close());
  }

  private toggle(): void { this.open ? this.close() : this.openDropdown(); }

  private openDropdown(): void {
    this.open = true;
    this.btn.setAttribute('aria-expanded', 'true');
    this.buildPanel();
    this.panel.style.display = 'block';
    positionDropdownPanel(this.btn, this.panel);
  }

  private close(): void {
    this.open = false;
    this.btn.setAttribute('aria-expanded', 'false');
    this.panel.style.display = 'none';
  }
}
