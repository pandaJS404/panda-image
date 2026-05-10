import React from 'react'

import { useUiTheme } from '../src/ui-theme'

export default function ThemeToggle() {
  const { isDark, uiTheme, toggleUiTheme } = useUiTheme()
  const currentThemeLabel = isDark ? '暗黑' : '亮色'

  return (
    <div className="theme-toggle-shell" data-theme={uiTheme}>
      <span className="theme-toggle__label">{currentThemeLabel}</span>
      <label className="cosmic-toggle" data-cy="theme-toggle">
        <input
          className="cosmic-toggle__input"
          type="checkbox"
          checked={isDark}
          onChange={toggleUiTheme}
        />
        <div className="cosmic-toggle__slider">
          <div className="cosmic-toggle__cosmos" />
          <div className="cosmic-toggle__energy-line" />
          <div className="cosmic-toggle__energy-line" />
          <div className="cosmic-toggle__energy-line" />
          <div className="cosmic-toggle__orb">
            <div className="cosmic-toggle__inner-orb" />
            <div className="cosmic-toggle__ring" />
          </div>
          <div className="cosmic-toggle__particles">
            <div style={{ '--tx': '10px', '--ty': '-17px' }} className="cosmic-toggle__particle" />
            <div style={{ '--tx': '17px', '--ty': '-10px' }} className="cosmic-toggle__particle" />
            <div style={{ '--tx': '20px', '--ty': '0px' }} className="cosmic-toggle__particle" />
            <div style={{ '--tx': '17px', '--ty': '10px' }} className="cosmic-toggle__particle" />
            <div style={{ '--tx': '10px', '--ty': '17px' }} className="cosmic-toggle__particle" />
            <div style={{ '--tx': '0px', '--ty': '20px' }} className="cosmic-toggle__particle" />
          </div>
        </div>
      </label>
    </div>
  )
}
