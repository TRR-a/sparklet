// Shortcut panel: shortcut data [快捷键面板 - 快捷键数据]

/** Shortcut entry definition [快捷键条目定义] */
interface ShortcutEntry {
  /** Key combo displayed in the kbd chip [kbd 徽章中显示的组合键] */
  keys: string;
  /** i18n key of the action label [动作标签的 i18n 键] */
  labelKey: string;
}

/** Shortcut group definition [快捷键分组定义] */
interface ShortcutGroup {
  /** i18n key of the group title [分组标题的 i18n 键] */
  groupKey: string;
  entries: ShortcutEntry[];
}

/** All documented shortcuts [全部快捷键] */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    groupKey: 'shortcutPanel.groupGeneral',
    entries: [
      { keys: 'Ctrl + F', labelKey: 'shortcutPanel.action.search' },
      { keys: 'Ctrl + N', labelKey: 'shortcutPanel.action.newNote' },
      { keys: 'Ctrl + P', labelKey: 'shortcutPanel.action.preview' },
      { keys: 'F1', labelKey: 'shortcutPanel.action.shortcuts' },
      { keys: 'Esc', labelKey: 'shortcutPanel.action.closeMenu' },
    ],
  },
  {
    groupKey: 'shortcutPanel.groupNotes',
    entries: [
      { keys: 'Ctrl + 1 … 0', labelKey: 'shortcutPanel.action.quickJump' },
      { keys: 'Ctrl', labelKey: 'shortcutPanel.action.quickJumpHints' },
      { keys: 'Esc Esc', labelKey: 'shortcutPanel.action.exit' },
    ],
  },
];
