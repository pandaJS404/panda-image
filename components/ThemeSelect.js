import React from 'react'

import Toggle from './Toggle'
import SvgAsset from './svg/SvgAsset'
import WindowThemeBwAsset from './svg/assets/window-theme-bw.svg?react'
import WindowThemeBoxyAsset from './svg/assets/window-theme-boxy.svg?react'
import WindowThemeNoneAsset from './svg/assets/window-theme-none.svg?react'

const WINDOW_THEMES_MAP = {
  none: WindowThemeNoneAsset,
  bw: WindowThemeBwAsset,
  boxy: WindowThemeBoxyAsset,
}

class ThemeSelect extends React.Component {
  select = theme => {
    if (this.props.selected !== theme) {
      this.props.onChange('windowTheme', theme)
    }
  }

  handleKeyDown = theme => event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      this.select(theme)
    }
  }

  renderThemes() {
    const selectedTheme = this.props.selected === 'sharp' ? 'none' : this.props.selected

    return Object.keys(WINDOW_THEMES_MAP).map(theme => {
      const asset = WINDOW_THEMES_MAP[theme]
      const checked = selectedTheme === theme

      return (
        <button
          type="button"
          key={theme}
          role="radio"
          className="window-theme-option"
          data-selected={checked || undefined}
          tabIndex={checked ? 0 : -1}
          onClick={this.select.bind(null, theme)}
          onKeyDown={this.handleKeyDown(theme)}
          value={theme}
        >
          <SvgAsset component={asset} />
        </button>
      )
    })
  }

  render() {
    return (
      <div className="window-theme">
        <Toggle
          label="显示窗口控件"
          enabled={this.props.windowControls}
          onChange={value => this.props.onChange('windowControls', value)}
        />
        {this.props.windowControls ? (
          <div className="window-theme-options" role="radiogroup">
            {this.renderThemes()}
          </div>
        ) : null}
      </div>
    )
  }
}

export default ThemeSelect
