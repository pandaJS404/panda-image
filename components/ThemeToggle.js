import React from 'react'
import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import { Switch } from 'antd'

import { useUiTheme } from '../src/ui-theme'

export default function ThemeToggle() {
  const { isDark, uiTheme, toggleUiTheme } = useUiTheme()
  const currentThemeLabel = isDark ? '暗黑' : '日间'
  const nextThemeLabel = isDark ? '切换到日间模式' : '切换到暗黑模式'

  return (
    <div className="theme-toggle-shell" data-theme={uiTheme}>
      <span className="theme-toggle__label">{currentThemeLabel}</span>
      <span
        className="theme-toggle__switch-shell"
        data-checked={isDark || undefined}
        aria-tooltip={nextThemeLabel}
      >
        <Switch
          checked={isDark}
          className="theme-toggle"
          data-cy="theme-toggle"
          onChange={toggleUiTheme}
        />
        <span className="theme-toggle__state-icon">
          {isDark ? <MoonOutlined /> : <SunOutlined />}
        </span>
      </span>
    </div>
  )
}
