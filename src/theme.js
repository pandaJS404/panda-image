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
    meta: '#f4f7fb',
    appBg: '#f4f7fb',
    surface1: '#ffffff',
    surface2: '#edf2f7',
    surface3: '#dbe5f0',
    surface4: '#c8d5e3',
    borderSubtle: 'rgba(15, 23, 42, 0.08)',
    borderStrong: 'rgba(15, 23, 42, 0.16)',
    textPrimary: 'rgba(15, 23, 42, 0.92)',
    textSecondary: 'rgba(15, 23, 42, 0.64)',
    textTertiary: 'rgba(15, 23, 42, 0.48)',
    accent: '#57b5f9',
    focusRing: 'rgba(87, 181, 249, 0.3)',
    panelShadow: '0 18px 40px rgba(15, 23, 42, 0.1)',
    overlayBackdrop: 'rgba(241, 245, 249, 0.84)',
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
  const isLight = normalizeUiTheme(uiTheme) === 'light'

  return {
    colorPrimary: colors.accent,
    colorInfo: colors.accent,
    colorSuccess: '#37b589',
    colorWarning: '#f8e81c',
    colorError: '#ff5f56',
    colorBgBase: colors.appBg,
    colorBgLayout: colors.appBg,
    colorBgContainer: colors.surface1,
    colorBgElevated: colors.surface2,
    colorBgSpotlight: colors.surface2,
    colorBgContainerDisabled: isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.06)',
    colorBgMask: colors.overlayBackdrop,
    colorText: colors.textPrimary,
    colorTextSecondary: colors.textSecondary,
    colorTextTertiary: colors.textTertiary,
    colorTextQuaternary: isLight ? 'rgba(15, 23, 42, 0.36)' : 'rgba(255, 255, 255, 0.38)',
    colorTextPlaceholder: colors.textTertiary,
    colorTextLightSolid: '#ffffff',
    colorIcon: colors.textSecondary,
    colorIconHover: colors.textPrimary,
    colorBorder: colors.borderStrong,
    colorBorderSecondary: colors.borderSubtle,
    colorSplit: colors.borderSubtle,
    colorFill: isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.14)',
    colorFillSecondary: isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.08)',
    colorFillTertiary: isLight ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.12)',
    colorPrimaryBg: isLight ? 'rgba(87, 181, 249, 0.12)' : 'rgba(87, 181, 249, 0.18)',
    colorPrimaryBgHover: isLight ? 'rgba(87, 181, 249, 0.18)' : 'rgba(87, 181, 249, 0.24)',
    colorPrimaryBorder: colors.accent,
    controlHeight: 40,
    controlHeightSM: 32,
    controlHeightLG: 44,
    controlOutline: colors.focusRing,
    controlOutlineWidth: 2,
    lineWidthFocus: 2,
    borderRadius: 8,
    borderRadiusSM: 6,
    borderRadiusLG: 10,
    fontSize: 13,
    fontSizeSM: 12,
    fontSizeLG: 14,
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
    contentFontSize: 13,
    contentFontSizeSM: 12,
    contentFontSizeLG: 14,
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
    titleFontSize: 14,
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
    optionFontSize: 13,
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
    trackPadding: 2,
  },
  Collapse: {
    headerBg: 'transparent',
    contentBg: 'transparent',
  },
  Popover: {
    colorBgElevated: 'var(--surface-panel-raised)',
    borderRadiusLG: 10,
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
    railSize: 4,
    handleSize: 12,
    handleSizeHover: 14,
  },
  Switch: {
    trackHeight: 24,
    trackHeightSM: 20,
    trackMinWidth: 40,
    trackMinWidthSM: 32,
    trackPadding: 2,
    handleSize: 18,
    handleSizeSM: 14,
    innerMinMargin: 9,
    innerMaxMargin: 24,
    innerMinMarginSM: 7,
    innerMaxMarginSM: 18,
    handleBg: '#fff',
  },
}
