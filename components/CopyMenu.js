import React from 'react'
import { CopyOutlined } from '@ant-design/icons'
import { App as AntdApp, Popover } from 'antd'
import { useAsyncCallback, useKeyboardListener } from '../src/shared/react/hooks'

import ButtonPrimitive from './buttons/ButtonPrimitive'
import ToolbarIconButton from './buttons/ToolbarIconButton'

function CopyButton(props) {
  return <ButtonPrimitive {...props} fullWidth className="copy-action-button" />
}

function useClipboardSupport() {
  const [isClipboardSupported, setClipboardSupport] = React.useState(false)

  React.useEffect(() => {
    setClipboardSupport(Boolean(window.navigator?.clipboard) && typeof ClipboardItem === 'function')
  }, [])

  return isClipboardSupported
}

function CopyMenu({ copyImage }) {
  const { message } = AntdApp.useApp()
  const clipboardSupported = useClipboardSupport()
  const [open, setOpen] = React.useState(false)

  const [showCopied, { loading: copied }] = useAsyncCallback(
    () => new Promise(resolve => setTimeout(resolve, 1000)),
  )

  const [copy, { loading }] = useAsyncCallback(async event => {
    if (event?.preventDefault) {
      event.preventDefault()
    }

    if (!clipboardSupported) {
      message.warning('当前浏览器不支持剪贴板图片复制')
      return
    }

    await copyImage()
    message.success('已复制图片')
    await showCopied()
  })

  useKeyboardListener('cmd-shift-c', event => {
    event.preventDefault()
    copy(event).catch(() => {
      message.error('复制失败，请重试')
    })
  })

  const handleCopyClick = event => {
    copy(event).catch(() => {
      message.error('复制失败，请重试')
    })
  }

  return (
    <div className="copy-menu-container copy-menu-container--contrast tools-item">
      <div className="copy-trigger">
        <Popover
          trigger="click"
          placement="bottomRight"
          open={open}
          onOpenChange={setOpen}
          classNames={{ root: 'copy-menu-popover' }}
          styles={{ body: { padding: 0 } }}
          getPopupContainer={triggerNode => triggerNode.parentElement || document.body}
          content={
            <div className="copy-menu-panel">
              <div className="copy-row copy-row--contrast">
                <span>复制图片</span>
                {clipboardSupported ? (
                  <CopyButton id="export-clipboard" onClick={handleCopyClick} disabled={loading}>
                    {loading ? '复制中…' : copied ? '已复制' : '复制'}
                  </CopyButton>
                ) : (
                  <span className="copy-row__hint">当前浏览器不支持</span>
                )}
              </div>
            </div>
          }
        >
          <ToolbarIconButton tone="muted" className="copy-trigger-button" aria-tooltip="复制菜单">
            <CopyOutlined />
          </ToolbarIconButton>
        </Popover>
      </div>
    </div>
  )
}

export default React.memo(CopyMenu)
