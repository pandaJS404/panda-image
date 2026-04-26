import React from 'react'
import { useCopyTextHandler } from '../src/shared/react/hooks'

import { COLORS } from '../src/modules/editor/config'
import SvgAsset from './svg/SvgAsset'
import CheckMarkAsset from './svg/assets/checkmark.svg?react'
import ControlsBoxyAsset from './svg/assets/controls-boxy.svg?react'
import ControlsBwAsset from './svg/assets/controls-bw.svg?react'
import ControlsDefaultAsset from './svg/assets/controls-default.svg?react'
import CopyAsset from './svg/assets/copy.svg?react'

const size = 24

const CopyButton = React.memo(function CopyButton({ text }) {
  const { onClick, copied } = useCopyTextHandler(text)

  return (
    <button onClick={onClick} className="window-copy-action">
      {copied ? (
        <SvgAsset component={CheckMarkAsset} size={size} color={COLORS.GRAY} />
      ) : (
        <SvgAsset component={CopyAsset} size={size} color={COLORS.GRAY} />
      )}
    </button>
  )
})

const WINDOW_THEMES_MAP = {
  bw: ControlsBwAsset,
  boxy: ControlsBoxyAsset,
}

export function TitleBar({ value, onChange }) {
  return (
    <div className="window-title-bar">
      <input
        type="text"
        spellCheck="false"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

export default function WindowControls({
  theme,
  copyable,
  code,
  light,
  titleBar,
  onTitleBarChange,
}) {
  return (
    <div
      className="window-controls"
      style={{
        '--window-controls-top': `${theme === 'bw' ? 36 : 34}px`,
        '--window-controls-margin-left': `${theme === 'bw' ? 16 : 14}px`,
        '--window-controls-margin-right': `${theme === 'boxy' ? 16 : 0}px`,
        '--window-controls-text-align': theme === 'boxy' ? 'right' : 'initial',
        '--window-title-color': light ? COLORS.BLACK : COLORS.SECONDARY,
      }}
    >
      <SvgAsset component={WINDOW_THEMES_MAP[theme] || ControlsDefaultAsset} />
      <TitleBar value={titleBar} onChange={onTitleBarChange} />
      {copyable && (
        <div className="copy-button">
          <CopyButton text={code} />
        </div>
      )}
    </div>
  )
}
