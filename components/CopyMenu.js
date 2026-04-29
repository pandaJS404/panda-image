import React from 'react'
import { CheckOutlined, CopyOutlined, LoadingOutlined } from '@ant-design/icons'
import { App as AntdApp } from 'antd'
import { useAsyncCallback, useKeyboardListener } from '../src/shared/react/hooks'

import ToolbarIconButton from './buttons/ToolbarIconButton'

function useClipboardSupport() {
  const [isClipboardSupported, setClipboardSupport] = React.useState(false)

  React.useEffect(() => {
    setClipboardSupport(Boolean(window.navigator?.clipboard) && typeof ClipboardItem === 'function')
  }, [])

  return isClipboardSupported
}

function getCopySuccessMessage(result) {
  if (result?.mimeType === 'image/webp' && result?.fallbackUsed !== true) {
    return '已复制 2x WebP'
  }

  return '当前剪贴板不支持 WebP，已复制 2x PNG'
}

function CopyMenu({ copyImage }) {
  const { message } = AntdApp.useApp()
  const clipboardSupported = useClipboardSupport()
  const copiedTimeoutRef = React.useRef(null)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(
    () => () => {
      if (copiedTimeoutRef.current) {
        window.clearTimeout(copiedTimeoutRef.current)
      }
    },
    [],
  )

  const showCopiedState = React.useCallback(() => {
    if (copiedTimeoutRef.current) {
      window.clearTimeout(copiedTimeoutRef.current)
    }

    setCopied(true)
    copiedTimeoutRef.current = window.setTimeout(() => {
      copiedTimeoutRef.current = null
      setCopied(false)
    }, 1200)
  }, [])

  const handleCopyFailure = React.useCallback(() => {
    message.error('复制失败，请重试')
  }, [message])

  const [copy, { loading }] = useAsyncCallback(async event => {
    if (event?.preventDefault) {
      event.preventDefault()
    }

    if (!clipboardSupported) {
      message.warning('当前浏览器不支持复制图片')
      return
    }

    const result = await copyImage()
    message.success(getCopySuccessMessage(result))
    showCopiedState()
  })

  const handleCopy = React.useCallback(
    event => {
      copy(event).catch(handleCopyFailure)
    },
    [copy, handleCopyFailure],
  )

  useKeyboardListener('cmd-shift-c', event => {
    event.preventDefault()
    handleCopy(event)
  })

  const tooltipLabel = loading ? '复制中' : copied ? '复制成功' : '复制图片'
  const icon = loading ? (
    <LoadingOutlined spin />
  ) : copied ? (
    <CheckOutlined />
  ) : (
    <CopyOutlined />
  )

  return (
    <div className="copy-menu-container copy-menu-container--contrast tools-item">
      <div className="copy-trigger">
        <ToolbarIconButton
          tone="muted"
          active={copied || loading}
          disabled={loading}
          className="copy-trigger-button"
          data-cy="copy-image-button"
          aria-tooltip={tooltipLabel}
          onClick={handleCopy}
        >
          {icon}
        </ToolbarIconButton>
      </div>
    </div>
  )
}

export default React.memo(CopyMenu)
