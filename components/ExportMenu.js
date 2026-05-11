import React from 'react'
import { Modal, Segmented } from 'antd'
import { useKeyboardListener, useAsyncCallback } from '../src/shared/react/hooks'

import { EXPORT_SIZES, EXPORT_SIZES_HASH } from '../src/modules/editor/config'
import Input from './Input'
import RainbowButton from './buttons/RainbowButton'

const EXPORT_FORMATS = [
  { id: 'export-png', label: 'PNG', format: 'blob' },
  { id: 'export-jpg', label: 'JPG', format: 'jpg' },
  { id: 'export-webp', label: 'WEBP', format: 'webp' },
  { id: 'export-svg', label: 'SVG', format: 'svg' },
]
const QUICK_EXPORT_FORMAT = 'webp'
const QUICK_EXPORT_SIZE = EXPORT_SIZES_HASH['4x'].value

function preventDefault(fn) {
  return event => {
    event.preventDefault()
    return fn(event)
  }
}

function ExportMenu({ onChange, exportSize, exportImage: exportPandaImage, filename = '' }) {
  const [open, setOpen] = React.useState(false)
  const [exportImage, { loading }] = useAsyncCallback(exportPandaImage)

  const getFilename = () => {
    const nextFilename = filename.trim()
    return nextFilename || undefined
  }

  const handleQuickExport = React.useCallback(
    () =>
      exportImage(QUICK_EXPORT_FORMAT, {
        filename: getFilename(),
        exportSize: QUICK_EXPORT_SIZE,
      }),
    [exportImage],
  )

  const handleQuickSvgExport = React.useCallback(
    () =>
      exportImage('svg', {
        filename: getFilename(),
      }),
    [exportImage],
  )

  const handleModalExport = format => async () => {
    await exportImage(format, { filename: getFilename() })
    setOpen(false)
  }

  const handlePreviewExport = async () => {
    await exportImage('blob', { filename: getFilename(), open: true })
    setOpen(false)
  }

  useKeyboardListener('cmd-shift-e', preventDefault(handleQuickExport))
  useKeyboardListener('cmd-shift-s', preventDefault(handleQuickSvgExport))

  return (
    <div className="export-menu-container export-menu-container--brand">
      <div className="export-trigger">
        <RainbowButton
          onClick={handleQuickExport}
          data-cy="quick-export-button"
          className="export-trigger-button export-trigger-button--quick"
          data-role="primary"
          aria-tooltip="快速导出"
        >
          {loading ? '导出中…' : '快速导出'}
        </RainbowButton>
        <RainbowButton
          id="export-menu"
          active={open}
          className="export-trigger-button export-trigger-button--menu"
          data-cy="export-button"
          data-role="menu"
          aria-tooltip="导出菜单"
          onClick={() => setOpen(true)}
        >
          {'导出配置'}
        </RainbowButton>
        <Modal
          open={open}
          title="导出"
          footer={null}
          centered
          destroyOnHidden
          maskTransitionName=""
          transitionName=""
          width="calc(100vw - 24px)"
          rootClassName="export-menu-modal"
          onCancel={() => setOpen(false)}
          styles={{ body: { padding: 0 } }}
        >
          {open ? (
            <div className="export-menu-panel">
              <div className="export-row">
                <span className="export-menu-filename">文件名</span>
                <Input
                  title="文件名"
                  placeholder="panda"
                  tone="brand"
                  fieldClassName="export-filename-field"
                  value={filename}
                  onChange={event => onChange('name', event.target.value)}
                />
              </div>
              <div className="export-row export-row--stacked">
                <span className="export-menu-filename">导出尺寸</span>
                <Segmented
                  block
                  className="export-size-segmented"
                  options={EXPORT_SIZES.map(({ name }) => ({ label: name, value: name }))}
                  value={exportSize}
                  onChange={value => onChange('exportSize', value)}
                />
              </div>
              <div className="export-row export-row--actions">
                <div className="export-action-stack">
                  <RainbowButton
                    fullWidth
                    className="export-open-button export-preview-button export-modal-rainbow-button"
                    onClick={handlePreviewExport}
                    disabled={loading}
                  >
                    预览
                  </RainbowButton>
                  <RainbowButton
                    fullWidth
                    className="export-download-button export-modal-rainbow-button"
                    onClick={handleModalExport('blob')}
                    disabled={loading}
                  >
                    导出
                  </RainbowButton>
                </div>
                <div className="export-save-container export-save-container--brand">
                  <span>下载</span>
                  <div className="export-format-actions">
                    {EXPORT_FORMATS.map(({ id, label, format }) => (
                      <RainbowButton
                        key={id}
                        className="export-format-button export-format-rainbow-button"
                        onClick={handleModalExport(format)}
                        id={id}
                        disabled={loading}
                      >
                        {label}
                      </RainbowButton>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
      </div>
    </div>
  )
}

export default React.memo(ExportMenu)
