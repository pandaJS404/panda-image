export const DEFAULT_UI_THEME = 'dark'
export const UI_THEME_STORAGE_KEY = 'PANDA_UI_THEME'

const UI_THEMES = new Set(['dark', 'light'])

export function normalizeUiTheme(value) {
  return UI_THEMES.has(value) ? value : DEFAULT_UI_THEME
}

export const APP_THEME_COLORS = {
  dark: {
    meta: '#0e1116',
    appBg: '#0e1116',
    surface1: '#141a22',
    surface2: '#1b2430',
    surface3: '#232d3a',
    surface4: '#2b3544',
    borderSubtle: 'rgba(255, 255, 255, 0.12)',
    borderStrong: 'rgba(255, 255, 255, 0.22)',
    textPrimary: 'rgba(255, 255, 255, 0.92)',
    textSecondary: 'rgba(255, 255, 255, 0.68)',
    textTertiary: 'rgba(255, 255, 255, 0.5)',
    accent: '#57b5f9',
    focusRing: 'rgba(87, 181, 249, 0.45)',
    panelShadow: '0 18px 48px rgba(0, 0, 0, 0.35)',
    overlayBackdrop: 'rgba(5, 10, 16, 0.82)',
  },
  light: {
    meta: '#eaecf0',
    appBg: '#eaecf0',
    surface1: '#f8f9fb',
    surface2: '#e4e7ed',
    surface3: '#cdd2da',
    surface4: '#b5bcc8',
    borderSubtle: 'rgba(15, 23, 42, 0.14)',
    borderStrong: 'rgba(15, 23, 42, 0.28)',
    textPrimary: 'rgba(8, 12, 28, 0.98)',
    textSecondary: 'rgba(15, 23, 42, 0.78)',
    textTertiary: 'rgba(15, 23, 42, 0.6)',
    accent: '#2680c9',
    focusRing: 'rgba(38, 128, 201, 0.38)',
    panelShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
    overlayBackdrop: 'rgba(234, 236, 240, 0.88)',
  },
}

export function getAppThemeColors(uiTheme) {
  return APP_THEME_COLORS[normalizeUiTheme(uiTheme)]
}

export function getThemeMetaColor(uiTheme) {
  return getAppThemeColors(uiTheme).meta
}

export function getThemeStatusBarStyle(uiTheme) {
  return normalizeUiTheme(uiTheme) === 'light' ? 'default' : 'black-translucent'
}

export function getAntdThemeTokens(uiTheme) {
  const colors = getAppThemeColors(uiTheme)

  return {
    colorPrimary: colors.accent,
    colorInfo: colors.accent,
    colorSuccess: 'var(--status-success)',
    colorWarning: 'var(--status-warning)',
    colorError: 'var(--status-danger)',
    colorBgBase: colors.appBg,
    colorBgLayout: 'var(--app-bg)',
    colorBgContainer: 'var(--surface-1)',
    colorBgElevated: 'var(--surface-2)',
    colorBgSpotlight: 'var(--surface-2)',
    colorBgContainerDisabled: 'var(--bg-disabled)',
    colorText: 'var(--text-primary)',
    colorTextSecondary: 'var(--text-secondary)',
    colorTextTertiary: 'var(--text-tertiary)',
    colorTextQuaternary: 'var(--text-quaternary)',
    colorTextPlaceholder: 'var(--text-tertiary)',
    colorTextLightSolid: '#ffffff',
    colorIcon: 'var(--text-secondary)',
    colorIconHover: 'var(--text-primary)',
    colorBorder: 'var(--border-strong)',
    colorBorderSecondary: 'var(--border-subtle)',
    colorSplit: 'var(--border-subtle)',
    colorFill: 'var(--fill)',
    colorFillSecondary: 'var(--fill-secondary)',
    colorFillTertiary: 'var(--fill-tertiary)',
    colorPrimaryBg: 'var(--primary-bg)',
    colorPrimaryBgHover: 'var(--primary-bg-hover)',
    colorPrimaryBorder: colors.accent,
    controlHeight: 40,
    controlHeightSM: 32,
    controlHeightLG: 44,
    controlOutline: colors.focusRing,
    borderRadius: 8,
    fontSize: 13,
    fontSizeSM: 12,
    boxShadow: colors.panelShadow,
    boxShadowSecondary: colors.panelShadow,
  }
}

export const ANTD_THEME_COMPONENTS = {
  Button: {
    fontWeight: 500,
    defaultShadow: 'none',
    primaryShadow: 'none',
    dangerShadow: 'none',
    paddingInline: 14,
    paddingInlineSM: 10,
    paddingInlineLG: 16,
    contentFontSizeSM: 12,
    onlyIconSize: 16,
    onlyIconSizeSM: 16,
    onlyIconSizeLG: 18,
  },
  Input: {
    paddingInline: 12,
    paddingInlineSM: 10,
    paddingInlineLG: 14,
    paddingBlock: 8,
    paddingBlockSM: 5,
    paddingBlockLG: 9,
  },
  Modal: {
    contentBg: 'var(--surface-panel)',
    headerBg: 'var(--surface-panel)',
    titleColor: 'var(--text-primary)',
    borderRadiusLG: 12,
  },
  Tabs: {
    itemColor: 'var(--text-secondary)',
    itemHoverColor: 'var(--text-primary)',
    itemSelectedColor: 'var(--text-primary)',
    inkBarColor: 'var(--accent)',
    horizontalMargin: '0',
    verticalItemPadding: '10px 12px',
  },
  Select: {
    optionPadding: '0 16px',
    optionHeight: 41,
    optionLineHeight: 1.5,
    optionSelectedFontWeight: 500,
    showArrowPaddingInlineEnd: 30,
    multipleItemHeight: 24,
  },
  Segmented: {
    itemSelectedBg: 'var(--surface-3)',
    itemSelectedColor: 'var(--text-primary)',
    trackBg: 'var(--surface-2)',
  },
  Collapse: {
    headerBg: 'transparent',
    contentBg: 'transparent',
  },
  Popover: {
    colorBgElevated: 'var(--surface-panel-raised)',
  },
  Slider: {
    railBg: 'var(--surface-3)',
    railHoverBg: 'var(--surface-4)',
    trackBg: 'var(--accent)',
    trackHoverBg: 'var(--accent)',
    trackBgDisabled: 'var(--border-subtle)',
    handleColor: 'var(--accent)',
    handleActiveColor: 'var(--accent)',
    handleActiveOutlineColor: 'var(--focus-ring)',
    controlSize: 10,
    handleSize: 12,
    handleSizeHover: 14,
  },
  Switch: {
    trackHeight: 24,
    trackMinWidth: 40,
    trackMinWidthSM: 32,
    handleSize: 18,
    handleSizeSM: 14,
    innerMinMargin: 9,
    innerMaxMargin: 24,
    innerMinMarginSM: 7,
    innerMaxMarginSM: 18,
  },
}
