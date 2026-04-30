import React from 'react'
import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import { Switch } from 'antd'

import { syncDomAttribute } from '../src/shared/react/hooks'
import { useUiTheme } from '../src/ui-theme'

export default function ThemeToggle() {
  const { isDark, uiTheme, toggleUiTheme } = useUiTheme()
  const currentThemeLabel = isDark ? '暗黑' : '日间'
  const nextThemeLabel = isDark ? '切换到日间模式' : '切换到暗黑模式'
  const switchShellRef = React.useRef(null)

  React.useEffect(() => {
    syncDomAttribute(switchShellRef.current, 'aria-tooltip', nextThemeLabel)
  }, [nextThemeLabel])

  return (
    <div className="theme-toggle-shell" data-theme={uiTheme}>
      <span className="theme-toggle__label">{currentThemeLabel}</span>
      <span
        ref={switchShellRef}
        className="theme-toggle__switch-shell"
        data-checked={isDark || undefined}
      >
        <Switch
          checked={isDark}
          checkedChildren={<MoonOutlined />}
          className="theme-toggle"
          data-cy="theme-toggle"
          unCheckedChildren={<SunOutlined />}
          onChange={toggleUiTheme}
        />
      </span>
    </div>
  )
}
