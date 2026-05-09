import React from 'react'

import ButtonPrimitive from '../buttons/ButtonPrimitive'
import { THEMES_HASH } from '../../src/modules/editor/config'
import { prepareConfigForExport, prepareConfigForImport, fileToJSON } from '../../src/shared/utils'

function getConfigDownloadName(themeId) {
  const themeName = THEMES_HASH[themeId]?.name || 'Custom'
  return `Panda-${themeName}-config.json`
}

export default function MiscSettings({ format, reset, applyPreset, settings }) {
  const inputRef = React.useRef(null)
  let download
  const sectionedSettings = React.useMemo(() => prepareConfigForExport(settings), [settings])
  const downloadName = getConfigDownloadName(settings.theme)

  try {
    download = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(sectionedSettings))}`
  } catch {
    download = undefined
  }

  return (
    <div className="settings-content settings-content--misc">
      <div className="settings-misc-actions settings-misc-row">
        <input
          hidden
          ref={inputRef}
          type="file"
          accept=".json"
          onChange={async event => {
            const json = await fileToJSON(event.target.files[0])
            if (json) {
              applyPreset(prepareConfigForImport(json))
            }
          }}
        />
        <ButtonPrimitive
          fullWidth
          className="settings-misc-button"
          data-layout="split"
          onClick={() => inputRef.current?.click()}
        >
          导入配置
        </ButtonPrimitive>
        <ButtonPrimitive
          fullWidth
          href={download}
          download={downloadName}
          className="settings-link-button settings-misc-button"
          data-layout="split"
        >
          导出配置
        </ButtonPrimitive>
      </div>
      <ButtonPrimitive
        fullWidth
        onClick={format}
        className="settings-misc-button"
        data-layout="stacked"
        data-tone="accent"
        data-cy="format-code-button"
      >
        美化代码
      </ButtonPrimitive>
      <ButtonPrimitive
        fullWidth
        onClick={reset}
        className="settings-misc-button"
        data-layout="stacked"
        data-tone="danger"
      >
        重置设置
      </ButtonPrimitive>
    </div>
  )
}
