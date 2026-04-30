import React from 'react'

import ThemeToggle from './ThemeToggle'
import SvgAsset from './svg/SvgAsset'
import LogoAsset from './svg/assets/logo.svg?react'

const Header = ({ enableHeroText }) => (
  <header role="banner" className="page-header mb4">
    <div className="page-header-content">
      <div className="page-header-bar">
        <a id="link-home" href="/">
          <SvgAsset component={LogoAsset} />
        </a>
        {enableHeroText ? (
          <h2 className="page-header-hero">
            一键把源码生成精美图片。
            <br />
            直接输入代码，或将文件拖进编辑区开始创作。
          </h2>
        ) : null}
        <ThemeToggle />
      </div>
    </div>
  </header>
)

export default Header
