// custom-dropdown.ts - Replace native <select> with a glassmorphism dropdown
// [用玻璃拟态自定义下拉替换原生 <select>]
// Keeps the original <select> in the DOM (hidden) so existing .value reads
// and 'change' listeners keep working untouched.
// [保留原 <select> 在 DOM 中（隐藏），现有 .value 读取和 'change' 监听无需改动]

class GlassDropdown {
  private select: HTMLSelectElement;
  private btn: HTMLButtonElement;
  private panel: HTMLDivElement;
  private open = false;

  constructor(select: HTMLSelectElement) {
    this.select = select;
    this.select.style.display = 'none';

    this.btn = document.createElement('button');
    this.btn.type = 'button';
    this.btn.className = 'glass-dropdown-btn';
    this.btn.innerHTML = '<span class="gd-label"></span><svg class="gd-arrow" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>';

    this.panel = document.createElement('div');
    this.panel.className = 'glass-dropdown-panel';
    this.panel.style.display = 'none';

    select.parentNode!.insertBefore(this.btn, select);
    select.parentNode!.insertBefore(this.panel, select.nextSibling);

    this.btn.addEventListener('click', () => this.toggle());
    document.addEventListener('click', (e) => {
      if (!this.btn.contains(e.target as Node) && !this.panel.contains(e.target as Node)) {
        this.close();
      }
    });

    this.syncFromSelect();
    // Keep the button label in sync when code sets select.value programmatically
    // [代码程序化设置 select.value 时同步按钮文字]
    // MutationObserver only catches setAttribute; also listen to 'change' events
    // which can be manually dispatched after programmatic value assignment
    // [MutationObserver 只能捕获 setAttribute；额外监听原生 change 事件（可在程序化赋值后手动派发）]
    new MutationObserver(() => this.syncFromSelect()).observe(select, { attributes: true, attributeFilter: ['value'] });
    select.addEventListener('change', () => this.syncFromSelect());
  }

  private syncFromSelect(): void {
    const opt = this.select.options[this.select.selectedIndex];
    const label = this.btn.querySelector('.gd-label')!;
    label.textContent = opt ? opt.textContent : '';
    this.buildPanel();
  }

  private buildPanel(): void {
    this.panel.innerHTML = '';
    for (const opt of Array.from(this.select.options)) {
      const item = document.createElement('div');
      item.className = 'glass-dropdown-item' + (opt.value === this.select.value ? ' active' : '');
      item.textContent = opt.textContent || '';
      item.addEventListener('click', () => {
        this.select.value = opt.value;
        this.select.dispatchEvent(new Event('change', { bubbles: true }));
        this.close();
      });
      this.panel.appendChild(item);
    }
  }

  private toggle(): void { this.open ? this.close() : this.openDropdown(); }

  private openDropdown(): void {
    this.open = true;
    this.btn.setAttribute('aria-expanded', 'true');
    this.buildPanel();
    this.panel.style.display = 'block';
    // Position panel below the button, flip up if near bottom of window
    // [面板在按钮下方弹出，靠近窗口底部时向上翻]
    const r = this.btn.getBoundingClientRect();
    this.panel.style.minWidth = `${this.btn.offsetWidth}px`;
    const below = r.bottom + 260 < window.innerHeight;
    if (below) {
      this.panel.style.top = `${r.bottom + 4}px`;
      this.panel.style.left = `${r.left}px`;
      this.panel.style.bottom = 'auto';
    } else {
      this.panel.style.bottom = `${window.innerHeight - r.top + 4}px`;
      this.panel.style.left = `${r.left}px`;
      this.panel.style.top = 'auto';
    }
  }

  private close(): void {
    this.open = false;
    this.btn.setAttribute('aria-expanded', 'false');
    this.panel.style.display = 'none';
  }
}

/** Upgrade every <select class="language-select"> (and updater selects) on the page [将页面上所有 <select> 升级为玻璃下拉] */
export function initCustomDropdowns(): void {
  document.querySelectorAll<HTMLSelectElement>('select.language-select, .updater-group select').forEach((sel) => {
    new GlassDropdown(sel);
  });
}
