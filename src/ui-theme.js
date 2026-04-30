import React from 'react'

import {
  DEFAULT_UI_THEME,
  UI_THEME_STORAGE_KEY,
  getAppThemeColors,
  getThemeMetaColor,
  normalizeUiTheme,
} from './theme'

const UiThemeContext = React.createContext(null)

function readStoredUiTheme() {
  if (typeof window === 'undefined') {
    return DEFAULT_UI_THEME
  }

  const rootTheme = document.documentElement?.dataset?.uiTheme

  if (rootTheme) {
    return normalizeUiTheme(rootTheme)
  }

  if (window.__PANDA_UI_THEME__) {
    return normalizeUiTheme(window.__PANDA_UI_THEME__)
  }

  try {
    return normalizeUiTheme(window.localStorage.getItem(UI_THEME_STORAGE_KEY))
  } catch (error) {
    return DEFAULT_UI_THEME
  }
}

function syncDocumentTheme(uiTheme) {
  if (typeof document === 'undefined') {
    return
  }

  const nextTheme = normalizeUiTheme(uiTheme)
  const root = document.documentElement

  root.dataset.uiTheme = nextTheme
  root.style.colorScheme = nextTheme

  const themeColorMeta = document.querySelector('meta[name="theme-color"]')
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', getThemeMetaColor(nextTheme))
  }

  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]')
  if (colorSchemeMeta) {
    colorSchemeMeta.setAttribute('content', nextTheme)
  }

  window.__PANDA_UI_THEME__ = nextTheme
}

export function UiThemeProvider({ children }) {
  const [uiTheme, setUiThemeState] = React.useState(readStoredUiTheme)

  React.useEffect(() => {
    syncDocumentTheme(uiTheme)

    try {
      window.localStorage.setItem(UI_THEME_STORAGE_KEY, uiTheme)
    } catch (error) {
      // Ignore storage failures and keep the in-memory preference.
    }
  }, [uiTheme])

  const setUiTheme = nextTheme => {
    React.startTransition(() => {
      setUiThemeState(currentTheme =>
        normalizeUiTheme(typeof nextTheme === 'function' ? nextTheme(currentTheme) : nextTheme),
      )
    })
  }

  const toggleUiTheme = () =>
    setUiTheme(currentTheme => (currentTheme === 'dark' ? 'light' : 'dark'))

  return (
    <UiThemeContext.Provider
      value={{
        uiTheme,
        isDark: uiTheme === 'dark',
        colors: getAppThemeColors(uiTheme),
        setUiTheme,
        toggleUiTheme,
      }}
    >
      {children}
    </UiThemeContext.Provider>
  )
}

export function useUiTheme() {
  const value = React.useContext(UiThemeContext)

  if (!value) {
    throw new Error('useUiTheme must be used within UiThemeProvider')
  }

  return value
}
