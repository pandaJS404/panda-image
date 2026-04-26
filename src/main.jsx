import React from 'react'
import ReactDOM from 'react-dom/client'
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd'
import { HelmetProvider } from 'react-helmet-async'

import App from './App.jsx'
import { ANTD_THEME_COMPONENTS, getAntdThemeTokens } from './theme.js'
import { UiThemeProvider, useUiTheme } from './ui-theme.js'
import './styles/app.less'

function AppProviders() {
  const { uiTheme } = useUiTheme()

  return (
    <HelmetProvider>
      <ConfigProvider
        theme={{
          algorithm: uiTheme === 'light' ? antdTheme.defaultAlgorithm : antdTheme.darkAlgorithm,
          token: getAntdThemeTokens(uiTheme),
          components: ANTD_THEME_COMPONENTS,
          hashed: false,
          cssVar: true,
        }}
      >
        <AntdApp>
          <App />
        </AntdApp>
      </ConfigProvider>
    </HelmetProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <UiThemeProvider>
    <AppProviders />
  </UiThemeProvider>,
)
