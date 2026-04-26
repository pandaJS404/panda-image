import React from 'react'
import { DownOutlined } from '@ant-design/icons'
import { Popover, Segmented } from 'antd'
import { useKeyboardListener, useAsyncCallback } from '../src/shared/react/hooks'

import { EXPORT_SIZES } from '../src/modules/editor/config'
import Input from './Input'
import ButtonPrimitive from './buttons/ButtonPrimitive'
import ToolbarButton from './buttons/ToolbarButton'

const EXPORT_FORMATS = [
  { id: 'export-png', label: 'PNG', format: 'blob' },
  { id: 'export-jpg', label: 'JPG', format: 'jpg' },
  { id: 'export-webp', label: 'WEBP', format: 'webp' },
  { id: 'export-svg', label: 'SVG', format: 'svg' },
]

function preventDefault(fn) {
  return event => {
    event.preventDefault()
    return fn(event)
  }
}

function ExportMenu({ onChange, exportSize, exportImage: exportPandaImage }) {
  const inputRef = React.useRef(null)
  const [open, setOpen] = React.useState(false)
  const [exportImage, { loading }] = useAsyncCallback(exportPandaImage)

  const getFilename = () => {
    return inputRef.current?.input?.value || inputRef.current?.value || undefined
  }

  const handleExport = format => () => exportImage(format, { filename: getFilename() })
  const handleOpenExport = () => exportImage('blob', { filename: getFilename(), open: true })

  useKeyboardListener('cmd-shift-e', preventDefault(handleExport('blob')))
  useKeyboardListener('cmd-shift-s', preventDefault(handleExport('svg')))

  return (
    <div className="export-menu-container export-menu-container--brand">
      <div className="export-trigger">
        <ToolbarButton
          justify="center"
          tone="brand"
          onClick={handleExport('blob')}
          data-cy="quick-export-button"
          className="export-trigger-button export-trigger-button--quick"
          data-role="primary"
          tooltipTitle="快速导出"
        >
          {loading ? '导出中…' : '快速导出'}
        </ToolbarButton>
        <Popover
          trigger="click"
          placement="bottomRight"
          open={open}
          onOpenChange={setOpen}
          classNames={{ root: 'export-menu-popover' }}
          styles={{ body: { padding: 0 } }}
          getPopupContainer={triggerNode => triggerNode.parentElement || document.body}
          content={
            <div className="export-menu-panel">
              <div className="export-row">
                <span className="export-menu-filename">文件名</span>
                <Input
                  ref={inputRef}
                  title="文件名"
                  placeholder="panda"
                  tone="brand"
                  fieldClassName="export-filename-field"
                />
              </div>
              <div className="export-row export-row--stacked">
                <span>尺寸</span>
                <Segmented
                  block
                  className="export-size-segmented"
                  options={EXPORT_SIZES.map(({ name }) => ({ label: name, value: name }))}
                  value={exportSize}
                  onChange={value => onChange('exportSize', value)}
                />
              </div>
              <div className="export-row export-row--actions">
                <ButtonPrimitive fullWidth className="export-open-button" onClick={handleOpenExport}>
                  打开
                </ButtonPrimitive>
                <div className="export-save-container export-save-container--brand">
                  <span>下载</span>
                  <div className="export-format-actions">
                    {EXPORT_FORMATS.map(({ id, label, format }) => (
                      <ButtonPrimitive
                        key={id}
                        className="export-format-button"
                        onClick={handleExport(format)}
                        id={id}
                        disabled={loading}
                      >
                        {label}
                      </ButtonPrimitive>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <ToolbarButton
            id="export-menu"
            active={open}
            justify="between"
            tone="brand"
            className="export-trigger-button export-trigger-button--menu"
            data-cy="export-button"
            data-role="menu"
            tooltipTitle="导出菜单"
          >
            <span className="export-trigger-button__label">导出</span>
            <span className="export-trigger-button__icon">
              <DownOutlined />
            </span>
          </ToolbarButton>
        </Popover>
      </div>
    </div>
  )
}

export default React.memo(ExportMenu)
