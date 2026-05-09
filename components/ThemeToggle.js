import React from 'react'
import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import { Switch } from 'antd'

import { useUiTheme } from '../src/ui-theme'

export default function ThemeToggle() {
  const { isDark, uiTheme, toggleUiTheme } = useUiTheme()
  const currentThemeLabel = isDark ? '暗黑' : '日间'

  return (
    <div className="theme-toggle-shell" data-theme={uiTheme}>
      <span className="theme-toggle__label">{currentThemeLabel}</span>
      <Switch
        checked={isDark}
        checkedChildren={<MoonOutlined />}
        className="theme-toggle"
        data-cy="theme-toggle"
        unCheckedChildren={<SunOutlined />}
        onChange={toggleUiTheme}
      />
    </div>
  )
}
